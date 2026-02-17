/**
 * SupabaseClient — Thin wrapper around Supabase's PostgREST API.
 *
 * Uses raw fetch() calls. No npm packages or bundlers required.
 * Both MenuScene and GameOverScene call these methods; on failure,
 * callers fall back to the existing Google Apps Script code.
 */
window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.SupabaseClient = {

    /** Build standard headers for Supabase REST requests. */
    _headers: function () {
        var CFG = window.CVInvaders.Config;
        return {
            'apikey': CFG.SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + CFG.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        };
    },

    /** REST endpoint URL for the scores table. */
    _url: function () {
        return window.CVInvaders.Config.SUPABASE_URL + '/rest/v1/scores';
    },

    /**
     * Fetch all scores, ordered by score descending.
     * Resolves with [{name, company, type, score, grade}, ...].
     * Rejects on any error (caller handles fallback).
     */
    fetchScores: function (timeoutMs) {
        timeoutMs = timeoutMs || 8000;
        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, timeoutMs);

        return fetch(
            this._url() + '?select=name,company,type,score,grade&order=score.desc',
            {
                method: 'GET',
                headers: this._headers(),
                signal: controller.signal
            }
        )
        .then(function (res) {
            clearTimeout(timer);
            if (!res.ok) throw new Error('Supabase GET ' + res.status);
            return res.json();
        });
    },

    /**
     * Insert a new score row, then fetch the full leaderboard.
     * Resolves with the same array shape as fetchScores().
     * Rejects on any error (caller handles fallback).
     */
    saveAndFetch: function (entry, timeoutMs) {
        timeoutMs = timeoutMs || 10000;
        var self = this;
        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, timeoutMs);

        return fetch(this._url(), {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify({
                name: String(entry.name).substring(0, 30),
                company: String(entry.company).substring(0, 30),
                type: entry.type,
                score: entry.score,
                grade: entry.grade
            }),
            signal: controller.signal
        })
        .then(function (res) {
            clearTimeout(timer);
            if (!res.ok) throw new Error('Supabase POST ' + res.status);
            // INSERT succeeded — now fetch the full leaderboard
            return self.fetchScores();
        });
    },

    /** Check whether Supabase is configured (both URL and key present). */
    isConfigured: function () {
        var CFG = window.CVInvaders.Config;
        return !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
    }
};
