#!/bin/bash
# .claude/scripts/ralph/run-all-epics.sh
# Master orchestrator: runs all epics in dependency order with rate-limit recovery
#
# Usage: ./.claude/scripts/ralph/run-all-epics.sh
# Logs: /tmp/ralph-master.log + /tmp/ralph-epic-<id>.log per epic

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
EPIC_SCRIPT="$SCRIPT_DIR/epic.sh"
MASTER_LOG="/tmp/ralph-master.log"
RATE_LIMIT_SLEEP=90   # seconds to wait after rate limit before retry
MAX_EPIC_RETRIES=5    # max retries per epic on rate limit
ITERATIONS_PER_EPIC=20

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

log() { echo -e "$(date '+%H:%M:%S') $1" | tee -a "$MASTER_LOG"; }
log_info()    { log "${BLUE}[INFO]${NC}    $1"; }
log_success() { log "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { log "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { log "${RED}[ERROR]${NC}   $1"; }
log_phase()   { log "\n${BLUE}══════════════════════════════════════════${NC}"; log "${BLUE}  PHASE: $1${NC}"; log "${BLUE}══════════════════════════════════════════${NC}\n"; }

# Check if an epic still has open tasks
epic_has_open_tasks() {
    local epic_id="$1"
    local count
    count=$(bd list --parent "$epic_id" --status open 2>/dev/null | grep -c "^[├└│] ○\|^○" || true)
    [ "$count" -gt 0 ]
}

# Run a single epic with rate-limit retry logic
run_epic() {
    local epic_id="$1"
    local label="$2"
    local log_file="/tmp/ralph-epic-${epic_id}.log"
    local attempt=0

    log_info "Starting epic $epic_id ($label)"

    # Skip if already complete
    if ! epic_has_open_tasks "$epic_id"; then
        log_success "Epic $epic_id already complete, skipping."
        return 0
    fi

    while [ $attempt -lt $MAX_EPIC_RETRIES ]; do
        attempt=$((attempt + 1))
        log_info "Epic $epic_id — attempt $attempt/$MAX_EPIC_RETRIES"

        # Run the epic script, capture exit code
        set +e
        "$EPIC_SCRIPT" "$epic_id" -n "$ITERATIONS_PER_EPIC" 2>&1 | tee "$log_file"
        exit_code=$?
        set -e

        # Check for rate limit in output
        if grep -qi "rate.limit\|too many requests\|429\|overloaded\|capacity" "$log_file" 2>/dev/null; then
            log_warning "Rate limit detected for $epic_id. Sleeping ${RATE_LIMIT_SLEEP}s before retry..."
            sleep "$RATE_LIMIT_SLEEP"
            # Increase sleep for next retry (backoff)
            RATE_LIMIT_SLEEP=$((RATE_LIMIT_SLEEP + 60))
            continue
        fi

        case $exit_code in
            0)
                log_success "Epic $epic_id COMPLETE"
                return 0
                ;;
            1)
                # Max iterations reached — check if actually done
                if ! epic_has_open_tasks "$epic_id"; then
                    log_success "Epic $epic_id complete (all tasks closed)"
                    return 0
                fi
                log_warning "Epic $epic_id hit max iterations, continuing with next attempt..."
                ;;
            2)
                log_error "Epic $epic_id BLOCKED — manual intervention needed"
                log_error "Check activity.md and /tmp/ralph-epic-${epic_id}.log"
                return 2
                ;;
            3)
                log_error "Epic $epic_id STUCK — skipping to avoid infinite loop"
                return 3
                ;;
            *)
                log_warning "Epic $epic_id exited with code $exit_code, retrying..."
                sleep 30
                ;;
        esac

        # If still has open tasks, loop again
        if ! epic_has_open_tasks "$epic_id"; then
            log_success "Epic $epic_id complete after $attempt attempts"
            return 0
        fi
    done

    log_error "Epic $epic_id: max retries ($MAX_EPIC_RETRIES) exceeded"
    return 1
}

# Run multiple epics in parallel, wait for all
run_parallel() {
    local pids=()
    local labels=()
    local epic_ids=()

    log_phase "PARALLEL: $*"

    for epic_id in "$@"; do
        run_epic "$epic_id" "$epic_id" &
        pids+=($!)
        epic_ids+=("$epic_id")
    done

    local failed=0
    for i in "${!pids[@]}"; do
        set +e
        wait "${pids[$i]}"
        ec=$?
        set -e
        if [ $ec -ne 0 ]; then
            log_error "Epic ${epic_ids[$i]} failed with code $ec"
            failed=$((failed + 1))
        fi
    done

    return $failed
}

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

cd "$PROJECT_ROOT"

log_info "═══════════════════════════════════════════════════"
log_info "  Easter Hunt — Full Overnight Build"
log_info "  Started: $(date)"
log_info "  Log: $MASTER_LOG"
log_info "═══════════════════════════════════════════════════"

# Wait for already-running Epic 2 + 3 PIDs (25272, 25537)
# (If they've already finished, wait returns immediately)
log_phase "Phase 1 — Epic 2 (Backend) + Epic 3 (Frontend) [already running]"
log_info "Waiting for background PIDs 25272 and 25537..."

set +e
wait 25272 2>/dev/null; ec2=$?
wait 25537 2>/dev/null; ec3=$?
set -e

# Regardless of exit code, check if tasks remain and finish them
log_info "Background jobs done (exit codes: Epic2=$ec2, Epic3=$ec3)"

if epic_has_open_tasks "easter-hfs"; then
    log_warning "Epic 2 still has open tasks, continuing..."
    run_epic "easter-hfs" "Epic 2: Backend"
fi

if epic_has_open_tasks "easter-cpy"; then
    log_warning "Epic 3 still has open tasks, continuing..."
    run_epic "easter-cpy" "Epic 3: Frontend"
fi

log_success "Phase 1 complete"

# ─── Phase 2: Epic 4 (Creator) + Epic 5 (Bilder) ─────────────────────────────
log_phase "Phase 2 — Epic 4 (Creator Mode) + Epic 5 (Bild-Upload) [parallel]"
run_parallel "easter-l3q" "easter-0qp" || log_warning "Phase 2 had failures, continuing..."
log_success "Phase 2 complete"

# ─── Phase 3: Epic 6 (Puzzle) ─────────────────────────────────────────────────
log_phase "Phase 3 — Epic 6 (Minispiel: Puzzle)"
run_epic "easter-2xj" "Epic 6: Puzzle" || log_warning "Epic 6 had issues, continuing..."
log_success "Phase 3 complete"

# ─── Phase 4: Epic 11 (Spielfluss) ────────────────────────────────────────────
log_phase "Phase 4 — Epic 11 (Spielfluss & Player Mode)"
run_epic "easter-svi" "Epic 11: Spielfluss" || log_warning "Epic 11 had issues, continuing..."
log_success "Phase 4 complete"

# ─── Phase 5: Epic 13 (Content Library) ───────────────────────────────────────
log_phase "Phase 5 — Epic 13 (Content Library)"
run_epic "easter-a9a" "Epic 13: Content Library" || log_warning "Epic 13 had issues, continuing..."
log_success "Phase 5 complete"

# ─── Phase 6: Epics 7, 8, 9, 10 (weitere Minispiele) ─────────────────────────
log_phase "Phase 6 — Epics 7+8+9+10 (Zahlenrätsel, Labyrinth, Text, Bilder) [parallel]"
run_parallel "easter-mnj" "easter-2yq" "easter-hc6" "easter-ngj" || log_warning "Phase 6 had failures, continuing..."
log_success "Phase 6 complete"

# ─── Phase 7: Epic 12 (Audio) ─────────────────────────────────────────────────
log_phase "Phase 7 — Epic 12 (Audio & Feedback)"
run_epic "easter-e94" "Epic 12: Audio" || log_warning "Epic 12 had issues, continuing..."
log_success "Phase 7 complete"

# ─── Phase 8: Epic 14 (Polish) ────────────────────────────────────────────────
log_phase "Phase 8 — Epic 14 (Polish & Qualität)"
run_epic "easter-1gn" "Epic 14: Polish" || log_warning "Epic 14 had issues, continuing..."
log_success "Phase 8 complete"

# ─── Done ─────────────────────────────────────────────────────────────────────
log_info "═══════════════════════════════════════════════════"
log_success "ALL EPICS COMPLETE — $(date)"
log_info "Summary:"
bd stats 2>&1 | tee -a "$MASTER_LOG"
log_info "═══════════════════════════════════════════════════"
