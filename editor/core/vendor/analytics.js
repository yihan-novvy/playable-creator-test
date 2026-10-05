/*
 * Novvy H5 creative analytics
 *
 * This file is intended to live inside an h5_zip package. It never writes
 * cookies. Events are reported to https://tracking.novvy.ai as HTTPS GET
 * requests issued through novvy.request(), which has the SDK proxy the call
 * and therefore works from file:// without the CORS restrictions that block
 * fetch()/XHR. Requires bridge version >= 2; on older bridges there is no
 * transport and events are dropped.
 *
 * Vendored from docs/example/analytics.js. Local additions: the DEBUG hook
 * (NovvyAnalyticsConfig.debug === true, or ?novvy-analytics-debug=1) mirrors
 * every accepted emit into window.__novvyEventLog so plain-browser and
 * headless runs without the SDK bridge can still be verified end to end.
 * Everything else is kept byte-identical to the reference.
 */
(function (window, document) {
    'use strict';

    // NovvyAnalyticsConfig is reserved for future use; creative identity is
    // derived server-side from bid, so no fields are required from the page.
    var initialConfig = window.NovvyAnalyticsConfig || {};
    // Local extension (not in the platform reference): debug mirror for
    // environments without the SDK bridge transport (editor preview, tests).
    var DEBUG = initialConfig.debug === true
        || /(?:^|[?&])novvy-analytics-debug=1/.test((window.location && window.location.search) || '');
    var state = {
        active: false,
        started: false,
        sessionId: createId(),
        startedAt: 0,
        activeSince: 0,
        activeDuration: 0,
        pending: [],
        media: [],
        sendQueue: [],
        inflight: 0
    };
    var MAX_PENDING = 50;
    var MAX_QUEUE = 50;
    // The SDK rejects with `too_many_requests` past 4 concurrent calls, so the
    // transport gates itself rather than letting bursts (flushPending, media
    // progress checkpoints) drop on the floor.
    var MAX_INFLIGHT = 4;
    var MAX_PARAMS = 30;
    var MAX_VALUE_LENGTH = 160;
    var BLOCKED_KEY = /(?:email|phone|mobile|user(?:name)?|password|token|auth(?:orization)?|cookie|idfa|gaid|advertising|device[_-]?id)/i;
    var TRACKING_ENDPOINT = 'https://tracking.novvy.ai/v1/h5/event';

    function now() {
        return new Date().getTime();
    }

    function createId() {
        var bytes;
        var i;
        var result = '';
        if (window.crypto && window.crypto.getRandomValues) {
            bytes = new Uint8Array(16);
            window.crypto.getRandomValues(bytes);
            for (i = 0; i < bytes.length; i += 1) {
                result += ('0' + bytes[i].toString(16)).slice(-2);
            }
            return result;
        }
        return String(now()) + '-' + Math.random().toString(16).slice(2);
    }

    function bridgeVersion() {
        return typeof window.__novvyBridgeVersion === 'number' ? window.__novvyBridgeVersion : 0;
    }

    function systemInfo() {
        var nav = window.navigator || {};
        var connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
        return {
            language: nav.language || '',
            languages: nav.languages ? Array.prototype.slice.call(nav.languages, 0, 5) : [],
            user_agent: String(nav.userAgent || '').slice(0, 320),
            platform: String(nav.platform || '').slice(0, 80),
            viewport: {
                width: Math.round(window.innerWidth || 0),
                height: Math.round(window.innerHeight || 0),
                dpr: window.devicePixelRatio || 1
            },
            screen: {
                width: window.screen ? window.screen.width : 0,
                height: window.screen ? window.screen.height : 0,
                color_depth: window.screen ? window.screen.colorDepth : 0
            },
            timezone_offset_min: new Date().getTimezoneOffset(),
            orientation: window.screen && window.screen.orientation ? window.screen.orientation.type : '',
            network_type: connection.effectiveType || connection.type || ''
        };
    }

    /**
     * Parse OS name, OS version and browser version from a UA string.
     * Returns { os, os_v, b_v }.
     */
    function parseUaInfo(ua) {
        var os = '';
        var osVersion = '';
        var browserVersion = '';
        var m;

        // --- OS detection ---
        if (/android/i.test(ua)) {
            os = 'Android';
            m = ua.match(/Android\s+([\d._]+)/i);
            osVersion = m ? m[1] : '';
        } else if (/iphone|ipad|ipod/i.test(ua)) {
            os = 'iOS';
            m = ua.match(/OS\s+([\d_]+)/i);
            osVersion = m ? m[1].replace(/_/g, '.') : '';
        } else if (/windows phone/i.test(ua)) {
            os = 'Windows Phone';
            m = ua.match(/Windows Phone\s+([\d.]+)/i);
            osVersion = m ? m[1] : '';
        } else if (/windows/i.test(ua)) {
            os = 'Windows';
            m = ua.match(/Windows NT\s+([\d.]+)/i);
            osVersion = m ? m[1] : '';
        } else if (/macintosh|mac os x/i.test(ua)) {
            os = 'macOS';
            m = ua.match(/Mac OS X\s+([\d_.]+)/i);
            osVersion = m ? m[1].replace(/_/g, '.') : '';
        } else if (/cros/i.test(ua)) {
            os = 'ChromeOS';
        } else if (/linux/i.test(ua)) {
            os = 'Linux';
        }

        // --- Browser version detection ---
        m = ua.match(/Edg(?:e|A|iOS)?\/([\d.]+)/i);
        if (m) {
            browserVersion = 'Edge/' + m[1];
        } else {
            m = ua.match(/OPR\/([\d.]+)/i);
            if (m) {
                browserVersion = 'Opera/' + m[1];
            } else {
                m = ua.match(/SamsungBrowser\/([\d.]+)/i);
                if (m) {
                    browserVersion = 'SamsungBrowser/' + m[1];
                } else {
                    m = ua.match(/Chrome\/([\d.]+)/i);
                    if (m) {
                        browserVersion = 'Chrome/' + m[1];
                    } else {
                        m = ua.match(/Firefox\/([\d.]+)/i);
                        if (m) {
                            browserVersion = 'Firefox/' + m[1];
                        } else {
                            m = ua.match(/Version\/([\d.]+).*Safari/i);
                            if (m) { browserVersion = 'Safari/' + m[1]; }
                        }
                    }
                }
            }
        }

        return { os: os, os_v: osVersion, b_v: browserVersion };
    }

    function sanitize(params) {
        var clean = {};
        var count = 0;
        var key;
        var value;
        if (!params || typeof params !== 'object') {
            return clean;
        }
        for (key in params) {
            if (!Object.prototype.hasOwnProperty.call(params, key) || BLOCKED_KEY.test(key) || count >= MAX_PARAMS) {
                continue;
            }
            value = params[key];
            if (value === undefined || typeof value === 'function') {
                continue;
            }
            if (value !== null && typeof value === 'object') {
                try {
                    value = JSON.stringify(value);
                } catch (ignore) {
                    continue;
                }
            }
            value = String(value);
            clean[String(key).slice(0, 64)] = value.slice(0, MAX_VALUE_LENGTH);
            count += 1;
        }
        return clean;
    }

    function eventPayload(name, params) {
        var eventTime = now();
        var elapsed = state.started ? eventTime - state.startedAt : 0;
        var activeDuration = state.activeDuration + (state.active ? eventTime - state.activeSince : 0);
        return {
            schema: 'novvy.h5.analytics/1',
            event: name,
            event_id: createId(),
            timestamp_ms: eventTime,
            elapsed_ms: elapsed,
            active_duration_ms: activeDuration,
            bid: window.novvy && window.novvy.bid ? String(window.novvy.bid) : '',
            sdk: {
                bridge_version: bridgeVersion(),
                viewable: !!window.__novvyViewable,
                session_id: state.sessionId
            },
            system: systemInfo(),
            params: sanitize(params)
        };
    }

    /**
     * Build the query string for https://tracking.novvy.ai.
     *
     * Parameter schema:
     *   type  – fixed "event"
     *   name  – event name
     *   bid   – raw window.novvy.bid (already encrypted by SDK at injection)
     *   ts    – client millisecond timestamp
     *   seq   – monotonically increasing session sequence number
     *   la    – ISO-639-1 language code (first two chars of navigator.language)
     *   ua    – user-agent string
     *   tz    – timezone offset in minutes (negative = east of UTC)
     *   p     – URL-encoded JSON of private event parameters
     *   os    – operating system name
     *   b_v   – browser name + version (e.g. "Chrome/126.0")
     *   os_v  – OS version string
     */
    function queryString(payload) {
        var system = payload.system;
        var uaInfo = parseUaInfo(system.user_agent);
        var params;
        var fields;
        var result = [];
        var key;
        try {
            params = JSON.stringify(payload.params);
        } catch (ignore) {
            params = '{}';
        }
        fields = {
            type: 'event',
            name: payload.event,
            bid:  payload.bid,
            ts:   payload.timestamp_ms,
            la:   (system.language || '').slice(0, 2),
            ua:   system.user_agent,
            tz:   system.timezone_offset_min,
            p:    params,
            os:   uaInfo.os,
            b_v:  uaInfo.b_v,
            os_v: uaInfo.os_v
        };
        for (key in fields) {
            if (Object.prototype.hasOwnProperty.call(fields, key) &&
                    fields[key] !== '' && fields[key] !== undefined && fields[key] !== null) {
                result.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(fields[key])));
            }
        }
        return result.join('&');
    }

    function hasTransport() {
        return bridgeVersion() >= 2 && !!window.novvy && typeof window.novvy.request === 'function';
    }

    function release() {
        state.inflight -= 1;
        drain();
    }

    function dispatch(url) {
        var promise;
        state.inflight += 1;
        try {
            promise = window.novvy.request({ req_url: url, req_type: 'GET' });
        } catch (error) {
            promise = null;
        }
        if (!promise || typeof promise.then !== 'function') {
            state.inflight -= 1;
            return;
        }
        // The result is deliberately ignored, but the rejection must still be
        // consumed: an unhandled one would reach the unhandledrejection
        // listener below and emit another event, which fails the same way.
        promise.then(release, release);
    }

    function drain() {
        while (state.inflight < MAX_INFLIGHT && state.sendQueue.length) {
            dispatch(state.sendQueue.shift());
        }
    }

    function send(payload) {
        if (!hasTransport()) {
            return false;
        }
        if (state.sendQueue.length >= MAX_QUEUE) {
            state.sendQueue.shift();
        }
        state.sendQueue.push(TRACKING_ENDPOINT + '?' + queryString(payload));
        drain();
        return true;
    }

    function emit(name, params, allowBeforeStart) {
        var payload;
        if (!/^[a-z][a-z0-9_]{0,63}$/.test(name)) {
            return false;
        }
        if (DEBUG) {
            if (!window.__novvyEventLog) {
                window.__novvyEventLog = [];
            }
            window.__novvyEventLog.push({
                event: name,
                params: sanitize(params),
                elapsed_ms: state.started ? now() - state.startedAt : 0
            });
            try {
                console.info('[novvy-analytics]', name, sanitize(params));
            } catch (ignore) {}
        }
        if (!state.started && !allowBeforeStart) {
            if (state.pending.length >= MAX_PENDING) {
                state.pending.shift();
            }
            state.pending.push({ name: name, params: params });
            return false;
        }
        payload = eventPayload(name, params);
        return send(payload);
    }

    function flushPending() {
        var queued = state.pending.slice(0);
        var i;
        state.pending = [];
        for (i = 0; i < queued.length; i += 1) {
            emit(queued[i].name, queued[i].params);
        }
    }

    function activate() {
        if (!state.started) {
            state.started = true;
            state.startedAt = now();
            state.activeSince = state.startedAt;
            state.active = true;
            emit('creative_visible', { lifecycle: 'start' }, true);
            flushPending();
            return;
        }
        if (!state.active) {
            state.active = true;
            state.activeSince = now();
            emit('creative_visible', { lifecycle: 'resume' });
        }
    }

    function deactivate() {
        if (!state.started || !state.active) {
            return;
        }
        state.activeDuration += now() - state.activeSince;
        state.active = false;
        emit('creative_hidden', { active_duration_ms: state.activeDuration });
    }

    function onViewableChange(event) {
        if (event && event.detail && event.detail.viewable) {
            activate();
        } else {
            deactivate();
        }
    }

    /**
     * Report an ad click: emits creative_click AND calls the SDK bridge, which
     * fires the campaign's click URL. That call is billable and moves CTR, so
     * this belongs only on elements that genuinely take the user to the
     * advertiser's destination. For anything else, use interaction() below.
     */
    function trackClick(target, action, params) {
        var clickParams = sanitize(params);
        clickParams.target = target || 'unknown';
        clickParams.action = action || 'click';
        if (state.started && window.novvy && typeof window.novvy.click === 'function') {
            try {
                window.novvy.click(clickParams.target, clickParams.action);
            } catch (ignore) {}
        }
        return emit('creative_click', clickParams);
    }

    /**
     * Report a tap on a creative control that is not an ad click — the sound
     * toggle, a replay button, and so on. Same (target, action) shape as
     * trackClick, but it deliberately never touches window.novvy.click(): it
     * produces telemetry only and can never generate a billable click.
     */
    function trackInteraction(target, action, params) {
        var interactionParams = sanitize(params);
        interactionParams.target = target || 'unknown';
        interactionParams.action = action || 'tap';
        return emit('creative_interaction', interactionParams);
    }

    function registerMedia(element, options) {
        var mediaState;
        var checkpoints = [25, 50, 75];
        var i;
        if (!element || !element.addEventListener) {
            return;
        }
        mediaState = { element: element, name: (options && options.name) || element.id || 'media', seen: {} };
        state.media.push(mediaState);
        element.addEventListener('play', function () {
            emit('media_play', { media: mediaState.name, muted: !!element.muted });
        });
        element.addEventListener('pause', function () {
            if (!element.ended) {
                emit('media_pause', { media: mediaState.name, position_ms: Math.round((element.currentTime || 0) * 1000) });
            }
        });
        element.addEventListener('ended', function () {
            emit('media_complete', { media: mediaState.name, duration_ms: Math.round((element.duration || 0) * 1000) });
        });
        element.addEventListener('error', function () {
            emit('media_error', { media: mediaState.name, code: element.error ? element.error.code : 0 });
        });
        element.addEventListener('timeupdate', function () {
            var percentage;
            var checkpoint;
            if (!element.duration || !isFinite(element.duration)) {
                return;
            }
            percentage = (element.currentTime / element.duration) * 100;
            for (i = 0; i < checkpoints.length; i += 1) {
                checkpoint = checkpoints[i];
                if (percentage >= checkpoint && !mediaState.seen[checkpoint]) {
                    mediaState.seen[checkpoint] = true;
                    emit('media_progress', { media: mediaState.name, percent: checkpoint });
                }
            }
        });
    }

    function setupLifecycle() {
        if (bridgeVersion() >= 1) {
            if (window.__novvyViewable) {
                activate();
            }
            window.addEventListener('novvy:viewablechange', onViewableChange);
        } else {
            // Old SDKs and unsupported platforms have no lifecycle signal.
            activate();
        }
    }

    window.NovvyAnalytics = {
        track: function (name, params) {
            return emit(name, params);
        },
        click: trackClick,
        interaction: trackInteraction,
        registerMedia: registerMedia,
        isActive: function () {
            return state.active;
        },
        getSessionId: function () {
            return state.sessionId;
        }
    };

    window.addEventListener('error', function (event) {
        emit('creative_error', { message: event.message || '', source: event.filename || '', line: event.lineno || 0 });
    });
    window.addEventListener('unhandledrejection', function (event) {
        emit('creative_promise_rejection', { reason: event.reason && event.reason.message ? event.reason.message : String(event.reason || '') });
    });
    setupLifecycle();
}(window, document));
