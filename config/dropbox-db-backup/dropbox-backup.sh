#!/usr/bin/env bash
# Dumps a MySQL database running inside a docker container, gzips it,
# streams it directly to Dropbox (no full backup file ever touches local
# disk), and deletes Dropbox backups older than RETENTION_DAYS.
#
# Requires: bash 4+, curl, jq, gzip, docker, coreutils (dd/date/stat), flock
#
# Config is read from environment variables. Easiest way to run this under
# cron is to keep a env file (e.g. /etc/dropbox-backup.env, chmod 600) and
# source it from the crontab entry, e.g.:
#
#   5 3 * * * . /etc/dropbox-backup.env && /usr/local/bin/dropbox-mysql-backup.sh >> /var/log/dropbox-backup.log 2>&1
#
# See the accompanying SETUP.md for how to create the Dropbox app / tokens.

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
: "${DROPBOX_APP_KEY:?Set DROPBOX_APP_KEY}"
: "${DROPBOX_APP_SECRET:?Set DROPBOX_APP_SECRET}"
: "${DROPBOX_REFRESH_TOKEN:?Set DROPBOX_REFRESH_TOKEN}"
: "${MYSQL_ROOT_PASSWORD:?Set MYSQL_ROOT_PASSWORD}"

MYSQL_CONTAINER="${MYSQL_CONTAINER:-mysql}"        # docker container name/id
DB_NAME="${DB_NAME:-gab_mol_eng}"
DROPBOX_FOLDER="${DROPBOX_FOLDER:-/backups}"       # no trailing slash
RETENTION_DAYS="${RETENTION_DAYS:-14}"
CHUNK_SIZE="${CHUNK_SIZE:-$((8 * 1024 * 1024))}"   # 8 MiB per upload_session chunk

LOCK_FILE="${LOCK_FILE:-/tmp/dropbox-mysql-backup.lock}"
DATE_STAMP="$(date +%Y-%m-%d)"
FILENAME="backup-${DATE_STAMP}.sql.gz"
REMOTE_PATH="${DROPBOX_FOLDER%/}/${FILENAME}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

for bin in curl jq gzip docker dd flock; do
    command -v "$bin" >/dev/null 2>&1 || die "required command '$bin' not found"
done

# Prevent overlapping runs (mysqldump can take a while).
exec 9>"$LOCK_FILE"
flock -n 9 || die "another run is already in progress (lock: $LOCK_FILE)"

# ---------------------------------------------------------------------------
# Small retry wrapper for flaky network calls
# ---------------------------------------------------------------------------
retry() {
    local attempts=3 n=1
    until "$@"; do
        if (( n >= attempts )); then return 1; fi
        log "call failed, retrying ($n/$attempts)..."
        sleep $((n * 5))
        n=$((n + 1))
    done
}

# ---------------------------------------------------------------------------
# Auth: exchange the long-lived refresh token for a short-lived access token.
# Dropbox retired long-lived access tokens in 2021, so this refresh step is
# required for anything unattended (cron).
# ---------------------------------------------------------------------------
ACCESS_TOKEN=""
get_access_token() {
    local resp
    resp="$(curl -sS -X POST https://api.dropbox.com/oauth2/token \
        -d grant_type=refresh_token \
        -d refresh_token="$DROPBOX_REFRESH_TOKEN" \
        -d client_id="$DROPBOX_APP_KEY" \
        -d client_secret="$DROPBOX_APP_SECRET")"
    ACCESS_TOKEN="$(jq -r '.access_token // empty' <<<"$resp")"
    [[ -n "$ACCESS_TOKEN" ]] || die "could not get access token: $resp"
}

# ---------------------------------------------------------------------------
# Generic Dropbox RPC call (JSON in, JSON out) -> api.dropboxapi.com
# ---------------------------------------------------------------------------
dbx_rpc() {
    local endpoint="$1" data="$2" resp status body
    resp="$(curl -sS -w $'\n%{http_code}' -X POST "https://api.dropboxapi.com/2/${endpoint}" \
        --header "Authorization: Bearer ${ACCESS_TOKEN}" \
        --header "Content-Type: application/json" \
        --data "$data")"
    status="${resp##*$'\n'}"
    body="${resp%$'\n'*}"
    if [[ "$status" != "200" ]]; then
        log "Dropbox RPC ${endpoint} failed (HTTP ${status}): ${body}"
        return 1
    fi
    printf '%s' "$body"
}

# ---------------------------------------------------------------------------
# Generic Dropbox content call (binary body) -> content.dropboxapi.com
# $1 = endpoint, $2 = Dropbox-API-Arg JSON, $3 = file to send as the body
# (an empty file is fine and results in a zero-length body)
# ---------------------------------------------------------------------------
dbx_content() {
    local endpoint="$1" arg="$2" file="$3" resp status body
    resp="$(curl -sS -w $'\n%{http_code}' -X POST "https://content.dropboxapi.com/2/${endpoint}" \
        --header "Authorization: Bearer ${ACCESS_TOKEN}" \
        --header "Dropbox-API-Arg: ${arg}" \
        --header "Content-Type: application/octet-stream" \
        --data-binary "@${file}")"
    status="${resp##*$'\n'}"
    body="${resp%$'\n'*}"
    if [[ "$status" != "200" ]]; then
        log "Dropbox content ${endpoint} failed (HTTP ${status}): ${body}"
        return 1
    fi
    printf '%s' "$body"
}

# ---------------------------------------------------------------------------
# Stream stdin to a Dropbox path using the chunked Upload Session API
# (files/upload_session/{start,append_v2,finish}). This never needs to know
# the total size up front and never buffers more than one CHUNK_SIZE on
# disk, so it's suitable for piping mysqldump | gzip straight in without
# ever writing the full backup to the VM's disk.
# ---------------------------------------------------------------------------
upload_stream() {
    local remote_path="$1"
    local chunk="$TMP_DIR/chunk"
    local session_id="" offset=0 bytes started=0 resp

    while true; do
        # iflag=fullblock is essential: without it, dd stops at the first
        # short read from the pipe instead of filling the whole chunk.
        dd of="$chunk" bs="$CHUNK_SIZE" count=1 iflag=fullblock status=none < /dev/stdin
        bytes="$(wc -c < "$chunk")"

        if [[ "$started" -eq 0 ]]; then
            resp="$(retry dbx_content "files/upload_session/start" '{"close":false}' "$chunk")" \
                || die "upload_session/start failed"
            session_id="$(jq -r '.session_id // empty' <<<"$resp")"
            [[ -n "$session_id" ]] || die "upload_session/start returned no session_id: $resp"
            started=1
        elif [[ "$bytes" -gt 0 ]]; then
            local arg
            arg="$(jq -nc --arg sid "$session_id" --argjson off "$offset" \
                '{cursor:{session_id:$sid, offset:$off}, close:false}')"
            retry dbx_content "files/upload_session/append_v2" "$arg" "$chunk" >/dev/null \
                || die "upload_session/append_v2 failed at offset $offset"
        fi

        offset=$((offset + bytes))

        if [[ "$bytes" -lt "$CHUNK_SIZE" ]]; then
            # Short (or empty) read means the pipe hit EOF: this is the
            # last chunk. Close the session and commit the file.
            : > "$chunk"   # finish's body must correspond to this last, already-sent chunk
            local finish_arg
            finish_arg="$(jq -nc --arg sid "$session_id" --argjson off "$offset" --arg path "$remote_path" \
                '{cursor:{session_id:$sid, offset:$off}, commit:{path:$path, mode:"overwrite", mute:true}}')"
            resp="$(retry dbx_content "files/upload_session/finish" "$finish_arg" "$chunk")" \
                || die "upload_session/finish failed"
            echo "$resp"
            break
        fi
    done

    [[ "$offset" -gt 0 ]] || die "uploaded 0 bytes for $remote_path -- refusing to treat this as success"
}

# ---------------------------------------------------------------------------
# Delete stale backups: list DROPBOX_FOLDER, match backup-YYYY-MM-DD.sql.gz,
# and delete anything strictly older than RETENTION_DAYS. Comparing the
# zero-padded ISO date strings lexically is equivalent to comparing them
# chronologically, so no date-math/epoch conversion is needed.
# ---------------------------------------------------------------------------
prune_old_backups() {
    local cutoff resp cursor has_more entries
    cutoff="$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d)"
    log "pruning backups older than ${cutoff} in ${DROPBOX_FOLDER}"

    resp="$(retry dbx_rpc "files/list_folder" \
        "$(jq -nc --arg path "$DROPBOX_FOLDER" '{path:$path, recursive:false}')")" \
        || die "files/list_folder failed"

    while true; do
        entries="$(jq -c '.entries[]' <<<"$resp")"
        while IFS= read -r entry; do
            [[ -n "$entry" ]] || continue
            local tag name file_date full_path
            tag="$(jq -r '.[".tag"]' <<<"$entry")"
            [[ "$tag" == "file" ]] || continue
            name="$(jq -r '.name' <<<"$entry")"
            [[ "$name" =~ ^backup-([0-9]{4}-[0-9]{2}-[0-9]{2})\.sql\.gz$ ]] || continue
            file_date="${BASH_REMATCH[1]}"
            if [[ "$file_date" < "$cutoff" ]]; then
                full_path="$(jq -r '.path_lower' <<<"$entry")"
                log "deleting stale backup: ${name}"
                retry dbx_rpc "files/delete_v2" "$(jq -nc --arg path "$full_path" '{path:$path}')" >/dev/null \
                    || log "WARNING: failed to delete ${name}"
            fi
        done <<<"$entries"

        has_more="$(jq -r '.has_more' <<<"$resp")"
        [[ "$has_more" == "true" ]] || break
        cursor="$(jq -r '.cursor' <<<"$resp")"
        resp="$(retry dbx_rpc "files/list_folder/continue" "$(jq -nc --arg c "$cursor" '{cursor:$c}')")" \
            || die "files/list_folder/continue failed"
    done
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    get_access_token

    log "dumping ${DB_NAME} from container '${MYSQL_CONTAINER}' and streaming to ${REMOTE_PATH}"

    # docker exec runs mysqldump in the container; its stdout is piped
    # through gzip and directly into upload_stream, so the compressed
    # backup is never written to the VM's disk (only ~CHUNK_SIZE at a
    # time, in TMP_DIR, and that's cleaned up on exit).
    set +e
    docker exec "$MYSQL_CONTAINER" \
        env MYSQL_PWD="$MYSQL_ROOT_PASSWORD" \
        mysqldump -u root "$DB_NAME" \
        | gzip \
        | upload_stream "$REMOTE_PATH"
    pipe_status=("${PIPESTATUS[@]}")
    set -e

    if [[ "${pipe_status[0]}" -ne 0 ]]; then
        log "mysqldump failed (exit ${pipe_status[0]}) - removing the file we just uploaded to Dropbox"
        dbx_rpc "files/delete_v2" "$(jq -nc --arg path "$REMOTE_PATH" '{path:$path}')" >/dev/null || true
        die "aborting: backup was not created successfully"
    fi
    if [[ "${pipe_status[2]}" -ne 0 ]]; then
        die "upload to Dropbox failed"
    fi

    log "backup uploaded successfully"

    prune_old_backups

    log "done"
}

main "$@"
