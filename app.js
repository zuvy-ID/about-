/**
 * About You — The 1975
 * Interactive Music Video Concept
 *
 * This version removes the sync editor and focuses on an immersive
 * interactive cinematic video experience.
 */
 
// ─── Fallback Line Data with Interpolation (if window.whisperLyrics load fails) ───
const FALLBACK_LINE_DATA = [{
        time: 0.26,
        text: "I know a place"
    },
    {
        time: 9.90,
        text: "It's somewhere I go when I need to remember your face"
    },
    {
        time: 19.60,
        text: "We get married in our heads"
    },
    {
        time: 30.24,
        text: "Something to do while we try to recall how we met"
    },
    {
        time: 39.66,
        text: "Do you think I have forgotten?"
    },
    {
        time: 44.66,
        text: "Do you think I have forgotten?"
    },
    {
        time: 49.64,
        text: "Do you think I have forgotten"
    },
    {
        time: 54.70,
        text: "About you?"
    },
];
 
function interpolateLines(lines) {
    const words = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineWords = line.text.split(/\s+/);
        const lineStart = line.time;
        const lineEnd = (i + 1 < lines.length) ?
            lines[i + 1].time :
            lineStart + (lineWords.length * 0.45);
        const singDuration = (lineEnd - lineStart) * 0.85;
        const interval = lineWords.length > 1 ? singDuration / lineWords.length : 0;
 
        lineWords.forEach((word, wi) => {
            words.push({
                word,
                time: lineStart + (wi * interval),
                lineIndex: i
            });
        });
    }
    return words;
}
 
let lyrics = [];
 
// ─── DOM References ──────────────────────────────────────────────────────────
const audio = document.getElementById('audio-player');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const bottomBar = document.getElementById('bottom-bar');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const progressContainer = document.getElementById('progress-track');
const progressFill = document.getElementById('progress-fill');
const progressThumb = document.getElementById('progress-thumb');
const pauseIndicator = document.getElementById('pause-indicator');
const filmTrackSlantedUp = document.getElementById('film-track-slanted-up');
const filmTrackSlantedDown = document.getElementById('film-track-slanted-down');
const filmTrackHorizontal = document.getElementById('film-track-horizontal');
const infiniteViewport = document.getElementById('infinite-viewport');
const infiniteCamera = document.getElementById('infinite-camera');
const infiniteCanvas = document.getElementById('infinite-canvas');
const albumArtWrapper = document.querySelector('.album-art-wrapper');
const playerCard = document.querySelector('.player-card');
 
// Subtitle bar
const subtitleBar = document.createElement('div');
subtitleBar.id = 'subtitle-bar';
const subtitleLine = document.createElement('div');
subtitleLine.id = 'subtitle-line';
subtitleBar.appendChild(subtitleLine);
document.body.appendChild(subtitleBar);
let subtitleSpans = [];
 
 
// Card elements
const cardProgressFill = document.getElementById('card-progress-fill');
const cardTimeCurrent = document.getElementById('card-time-current');
const cardTimeTotal = document.getElementById('card-time-total');
const cardProgressTrack = document.getElementById('card-progress-track');
 
 
// ─── Cinematic Background Photos ─────────────────────────────────────────────
// Use user's own photos (scene-0 to scene-9) for the film strip background,
// repeated to fill all three strips.
const CINEMATIC_PHOTOS = Array.from({
    length: 10
}, (_, i) => `photos/scene-${i}.jpeg`);
 
function sampleAmbientColor(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 32, 32);
            const d = ctx.getImageData(0, 0, 32, 32).data;
            let r = 0,
                g = 0,
                b = 0,
                n = 0;
            for (let i = 0; i < d.length; i += 16) {
                r += d[i];
                g += d[i + 1];
                b += d[i + 2];
                n++;
            }
            r = Math.round(r / n);
            g = Math.round(g / n);
            b = Math.round(b / n);
            // Boost saturation
            const avg = (r + g + b) / 3;
            r = Math.min(255, Math.round(avg + (r - avg) * 1.7));
            g = Math.min(255, Math.round(avg + (g - avg) * 1.7));
            b = Math.min(255, Math.round(avg + (b - avg) * 1.7));
            // Ensure minimum brightness
            const br = (r + g + b) / 3;
            if (br < 80) {
                const f = 80 / br;
                r = Math.min(255, Math.round(r * f));
                g = Math.min(255, Math.round(g * f));
                b = Math.min(255, Math.round(b * f));
            }
            document.documentElement.style.setProperty('--ambient-r', r);
            document.documentElement.style.setProperty('--ambient-g', g);
            document.documentElement.style.setProperty('--ambient-b', b);
        } catch (e) {
            /* CORS or taint — keep previous color */ }
    };
    img.src = url;
}
 
// Build scrolling film strip (three sets for seamless loop on all viewports)
function buildTrack(track) {
    if (!track) return;
    track.innerHTML = '';
    const sets = window.innerWidth <= 600 ? 2 : 3;
    for (let set = 0; set < sets; set++) {
        CINEMATIC_PHOTOS.forEach((url, index) => {
            const frame = document.createElement('div');
            frame.className = 'film-frame';
            frame.dataset.index = index;
 
            const sprocketsTop = document.createElement('div');
            sprocketsTop.className = 'sprockets top';
 
            const photoContainer = document.createElement('div');
            photoContainer.className = 'film-photo-container';
 
            const img = document.createElement('img');
            img.src = url;
            img.className = 'film-photo';
            img.loading = 'lazy';
            photoContainer.appendChild(img);
 
            const sprocketsBottom = document.createElement('div');
            sprocketsBottom.className = 'sprockets bottom';
 
            frame.appendChild(sprocketsTop);
            frame.appendChild(photoContainer);
            frame.appendChild(sprocketsBottom);
 
            track.appendChild(frame);
        });
    }
}
 
function buildFilmStrip() {
    buildTrack(filmTrackSlantedUp);
    buildTrack(filmTrackSlantedDown);
    buildTrack(filmTrackHorizontal);
}
 
// ─── Camera + Infinite Canvas ────────────────────────────────────────────────
let scenes = [],
    currentActiveScene = null;
let camX = 0,
    camY = 0,
    camRot = 0;
let targetX = 0,
    targetY = 0,
    targetRot = 0;
let SCENE_W, SCENE_H, SCENE_GAP_Y;
const filmStripScene = document.getElementById('film-strip-scene');
 
const CAM_LERP = 0.04;
const CAM_ROT_LERP = 0.03;
 
function updateCamera() {
    camX += (targetX - camX) * CAM_LERP;
    camY += (targetY - camY) * CAM_LERP;
    camRot += (targetRot - camRot) * CAM_ROT_LERP;
 
    // Subtle organic float — barely perceptible
    const t = performance.now() * 0.001;
    const driftX = Math.sin(t * 0.18) * 1.0;
    const driftY = Math.sin(t * 0.13) * 0.7;
 
    infiniteCamera.style.transform =
        `translate3d(${(camX + driftX).toFixed(2)}px,${(camY + driftY).toFixed(2)}px,0) ` +
        `rotate(${camRot.toFixed(3)}deg)`;
 
}
 
function updateFilmFrameActive(sceneIdx) {
    const frameIdx = sceneIdx % CINEMATIC_PHOTOS.length;
    [filmTrackSlantedUp, filmTrackSlantedDown, filmTrackHorizontal].forEach(track => {
        if (!track) return;
        track.querySelectorAll('.film-frame').forEach(frame => {
            frame.classList.toggle('active', parseInt(frame.dataset.index) === frameIdx);
        });
    });
}
 
function buildScenes() {
    infiniteCanvas.innerHTML = '';
    scenes = [];
    subtitleSpans = [];
 
    const vW = window.innerWidth,
        vH = window.innerHeight;
    const isMobile = vW <= 600;
    SCENE_W = isMobile ? Math.min(vW * 0.82, 340) : Math.min(vW * 0.68, 560);
    SCENE_H = isMobile ? vH * 0.52 : vH * 0.72;
    SCENE_GAP_Y = isMobile ? vH * 0.78 : vH * 0.88;
    const ZIGZAG_X = isMobile ? vW * 0.08 : vW * 0.28;
 
    const lineGroups = {};
    lyrics.forEach((w, i) => {
        if (!lineGroups[w.lineIndex]) lineGroups[w.lineIndex] = [];
        lineGroups[w.lineIndex].push({
            ...w,
            globalIndex: i
        });
    });
 
    const lineKeys = Object.keys(lineGroups).sort((a, b) => parseInt(a) - parseInt(b));
 
    lineKeys.forEach((lineIdx, sceneIdx) => {
        const group = lineGroups[lineIdx];
        const fallbackPhoto = CINEMATIC_PHOTOS[sceneIdx % CINEMATIC_PHOTOS.length];
        const xDir = sceneIdx % 2 === 0 ? -1 : 1;
        const sceneX = vW / 2 + xDir * ZIGZAG_X - SCENE_W / 2;
        const sceneY = sceneIdx * SCENE_GAP_Y;
        const startTime = group[0].time;
        const nextKey = lineKeys[sceneIdx + 1];
        const endTime = nextKey ? lineGroups[nextKey][0].time : startTime + 8;
        const lyricPos = sceneIdx % 2 === 0 ? 'bottom' : 'top';
 
        const sceneEl = document.createElement('div');
        sceneEl.className = 'scene';
        sceneEl.style.cssText = `left:${sceneX}px;top:${sceneY}px;width:${SCENE_W}px;`;
 
        const photoWrap = document.createElement('div');
        photoWrap.className = 'scene-photo-wrap';
 
        // Try image first (jpeg/jpg/png/webp), then mp4, then Unsplash fallback
        const imgExts = ['jpeg', 'jpg', 'png', 'webp'];
 
        let photoEl = document.createElement('img');
        photoEl.className = 'scene-photo';
        photoEl.src = fallbackPhoto;
        photoWrap.appendChild(photoEl);
 
        let imgResolved = false;
        let extIdx = 0;
        const tryImg = () => {
            if (extIdx >= imgExts.length) {
                // No image found — try mp4
                const vid = document.createElement('video');
                vid.className = 'scene-photo';
                vid.autoplay = true;
                vid.muted = true;
                vid.loop = true;
                vid.playsInline = true;
                vid.preload = 'metadata';
                vid.src = `photos/scene-${sceneIdx}.mp4`;
                vid.onloadedmetadata = () => {
                    if (imgResolved) return;
                    imgResolved = true;
                    photoWrap.replaceChild(vid, photoEl);
                    photoEl = vid;
                    vid.play().catch(() => {});
                };
                return;
            }
            const src = `photos/scene-${sceneIdx}.${imgExts[extIdx++]}`;
            const t = new Image();
            t.onload = () => {
                if (imgResolved) return;
                imgResolved = true;
                photoEl.src = src;
            };
            t.onerror = tryImg;
            t.src = src;
        };
        tryImg();
 
        const lyricEl = document.createElement('div');
        lyricEl.className = `scene-lyric scene-lyric--${lyricPos}`;
        const wordSpans = [];
        group.forEach(wd => {
            const span = document.createElement('span');
            span.className = 'scene-word';
            span.textContent = wd.word;
            lyricEl.appendChild(span);
            wordSpans.push({
                span,
                globalIndex: wd.globalIndex
            });
        });
 
        if (lyricPos === 'top') {
            sceneEl.appendChild(lyricEl);
            sceneEl.appendChild(photoWrap);
        } else {
            sceneEl.appendChild(photoWrap);
            sceneEl.appendChild(lyricEl);
        }
        infiniteCanvas.appendChild(sceneEl);
 
        scenes.push({
            idx: sceneIdx,
            lineIdx: parseInt(lineIdx),
            el: sceneEl,
            photoEl,
            lyricEl,
            wordSpans,
            x: sceneX,
            y: sceneY,
            centerX: sceneX + SCENE_W / 2,
            centerY: sceneY + SCENE_H / 2,
            startTime,
            endTime,
            get photoUrl() {
                return photoEl.src || fallbackPhoto;
            },
            startIndex: group[0].globalIndex,
            endIndex: group[group.length - 1].globalIndex
        });
    });
 
    const totalH = scenes.length * SCENE_GAP_Y + vH;
    infiniteCanvas.style.height = `${totalH}px`;
    infiniteCanvas.style.width = `${vW * 1.8}px`;
}
 
function setFilmTracksPlayState(state) {
    const tracks = document.querySelectorAll('.film-track');
    tracks.forEach(track => {
        track.style.animationPlayState = state;
    });
}
 
// ─── Subtitle ────────────────────────────────────────────────────────────────
function buildSubtitleForLine(lineData) {
    subtitleLine.innerHTML = '';
    subtitleSpans = [];
    for (let i = lineData.startIndex; i <= lineData.endIndex; i++) {
        const span = document.createElement('span');
        span.className = 'subtitle-word';
        span.textContent = lyrics[i].word;
        subtitleLine.appendChild(span);
        subtitleSpans[i] = span;
    }
}
 
function clearSubtitleLine() {
    subtitleLine.innerHTML = '';
    subtitleSpans = [];
}
 
// ─── Sync Loop ───────────────────────────────────────────────────────────────
let animFrameId = null;
 
function syncLoop() {
    const t = audio.currentTime;
 
    // Find which scene is active based on startTime
    let newActiveScene = null;
    for (let i = scenes.length - 1; i >= 0; i--) {
        if (t >= scenes[i].startTime) {
            newActiveScene = scenes[i];
            break;
        }
    }
 
    if (newActiveScene !== currentActiveScene) {
        if (currentActiveScene) currentActiveScene.el.classList.remove('scene-active');
        if (newActiveScene) {
            newActiveScene.el.classList.add('scene-active');
            sampleAmbientColor(newActiveScene.photoUrl);
            updateFilmFrameActive(newActiveScene.idx);
            buildSubtitleForLine({
                startIndex: newActiveScene.startIndex,
                endIndex: newActiveScene.endIndex
            });
        } else {
            clearSubtitleLine();
        }
        currentActiveScene = newActiveScene;
    }
 
    // Look-ahead: pre-target next scene 1.8s before it starts so camera arrives on time
    {
        const vW = window.innerWidth,
            vH = window.innerHeight;
        let camTarget = newActiveScene;
        if (newActiveScene) {
            const nextIdx = newActiveScene.idx + 1;
            if (nextIdx < scenes.length) {
                const next = scenes[nextIdx];
                if (t >= next.startTime - 1.8) camTarget = next;
            }
        }
        if (camTarget) {
            // On mobile, player card sits at bottom (~80px). Shift scene up by half that
            // so the photo appears in the visible area above the card.
            const mobileOffset = vW <= 600 ? -50 : 0;
            targetX = vW / 2 - camTarget.centerX;
            targetY = vH / 2 - camTarget.centerY + mobileOffset;
            targetRot = camTarget.idx % 2 === 0 ? -0.35 : 0.35;
        }
    }
 
    if (newActiveScene) {
        let activeWordIdx = -1;
        for (let i = newActiveScene.endIndex; i >= newActiveScene.startIndex; i--) {
            if (t >= lyrics[i].time) {
                activeWordIdx = i;
                break;
            }
        }
 
        subtitleSpans.forEach((span, i) => {
            if (!span) return;
            if (i < activeWordIdx) span.className = 'subtitle-word spoken';
            else if (i === activeWordIdx) span.className = 'subtitle-word active';
            else span.className = 'subtitle-word';
        });
 
        newActiveScene.wordSpans.forEach(({
            span,
            globalIndex
        }) => {
            if (globalIndex < activeWordIdx) span.className = 'scene-word spoken';
            else if (globalIndex === activeWordIdx) span.className = 'scene-word active';
            else span.className = 'scene-word';
        });
    }
 
    updateCamera();
    updateProgress();
    animFrameId = requestAnimationFrame(syncLoop);
}
 
// ─── Progress System ─────────────────────────────────────────────────────────
let isSeekingProgress = false;
 
function formatTime(s) {
    if (isNaN(s) || s < 0) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}
 
function updateProgress() {
    if (isSeekingProgress) return;
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressThumb) progressThumb.style.left = pct + '%';
    if (timeCurrent) timeCurrent.textContent = formatTime(audio.currentTime);
 
    // Card Progress Update
    if (cardProgressFill) cardProgressFill.style.width = pct + '%';
    if (cardTimeCurrent) cardTimeCurrent.textContent = formatTime(audio.currentTime);
    if (cardTimeTotal && audio.duration) {
        const remaining = audio.duration - audio.currentTime;
        cardTimeTotal.textContent = '-' + formatTime(remaining);
    }
}
 
 
function seek(e) {
    if (!progressContainer) return;
    const rect = progressContainer.getBoundingClientRect();
    let clientX;
    if (e.clientX !== undefined) {
        clientX = e.clientX;
    } else if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
    }
 
    if (clientX === undefined) return;
 
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    if (progressFill) progressFill.style.width = (pct * 100) + '%';
    if (progressThumb) progressThumb.style.left = (pct * 100) + '%';
    if (timeCurrent) timeCurrent.textContent = formatTime(audio.duration ? pct * audio.duration : 0);
    return pct;
}
 
function commitSeek(pct) {
    if (pct !== undefined && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        audio.currentTime = pct * audio.duration;
    }
    isSeekingProgress = false;
}
 
if (progressContainer) {
    progressContainer.addEventListener('mousedown', (e) => {
        if (!audio.src && !audio.currentSrc) return;
        e.preventDefault();
        isSeekingProgress = true;
        lastSeekPct = seek(e) || 0;
    });
 
    document.addEventListener('mousemove', (e) => {
        if (isSeekingProgress) {
            e.preventDefault();
            lastSeekPct = seek(e) || lastSeekPct;
        }
    });
 
    document.addEventListener('mouseup', () => {
        if (isSeekingProgress) {
            isSeekingProgress = false;
            commitSeek(lastSeekPct);
        }
    });
 
    progressContainer.addEventListener('touchstart', (e) => {
        if (!audio.src && !audio.currentSrc) return;
        isSeekingProgress = true;
        lastSeekPct = seek(e) || 0;
    }, {
        passive: true
    });
 
    document.addEventListener('touchmove', (e) => {
        if (isSeekingProgress) {
            lastSeekPct = seek(e) || lastSeekPct;
        }
    }, {
        passive: true
    });
 
    document.addEventListener('touchend', () => {
        if (isSeekingProgress) {
            isSeekingProgress = false;
            commitSeek(lastSeekPct);
        }
    });
 
    progressContainer.addEventListener('click', (e) => {
        if (!audio.src && !audio.currentSrc) return;
        const pct = seek(e);
        commitSeek(pct);
    });
}
 
// ─── Playback Control ────────────────────────────────────────────────────────
function updatePlayButtonUI() {
    const isPlaying = !audio.paused && !audio.ended;
    if (isPlaying) {
        startBtn.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1"/>
        <rect x="14" y="4" width="4" height="16" rx="1"/>
      </svg>
    `;
    } else {
        startBtn.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="8 5 19 12 8 19 8 5"/>
      </svg>
    `;
    }
}
 
function startPlay() {
    startOverlay.classList.add('playing');
    if (bottomBar) bottomBar.classList.add('visible');
    audio.play().catch(err => {
        console.error("Playback failed:", err);
    });
}
 
function togglePlay() {
    if (!startOverlay.classList.contains('playing')) {
        startPlay();
        return;
    }
    if (audio.paused) {
        audio.play().catch(() => {});
    } else {
        audio.pause();
    }
}
 
startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlay();
});
 
document.addEventListener('click', (e) => {
    if (e.target.closest('.player-card')) return;
    togglePlay();
});
 
// Setup card progress seek
function seekCard(e) {
    const rect = cardProgressTrack.getBoundingClientRect();
    let clientX;
    if (e.clientX !== undefined) {
        clientX = e.clientX;
    } else if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
    }
 
    if (clientX === undefined) return;
 
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    if (cardProgressFill) cardProgressFill.style.width = (pct * 100) + '%';
    if (cardTimeCurrent) cardTimeCurrent.textContent = formatTime(audio.duration ? pct * audio.duration : 0);
    if (cardTimeTotal && audio.duration) {
        const remaining = audio.duration - (audio.duration ? pct * audio.duration : 0);
        cardTimeTotal.textContent = '-' + formatTime(remaining);
    }
    return pct;
}
 
if (cardProgressTrack) {
    cardProgressTrack.addEventListener('mousedown', (e) => {
        if (!audio.src && !audio.currentSrc) return;
        e.preventDefault();
        isSeekingProgress = true;
        lastSeekPct = seekCard(e) || 0;
 
        const onMouseMove = (moveEvent) => {
            if (isSeekingProgress) {
                lastSeekPct = seekCard(moveEvent) || lastSeekPct;
            }
        };
 
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            if (isSeekingProgress) {
                isSeekingProgress = false;
                commitSeek(lastSeekPct);
            }
        };
 
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
 
    cardProgressTrack.addEventListener('touchstart', (e) => {
        if (!audio.src && !audio.currentSrc) return;
        isSeekingProgress = true;
        lastSeekPct = seekCard(e) || 0;
 
        const onTouchMove = (moveEvent) => {
            if (isSeekingProgress) {
                lastSeekPct = seekCard(moveEvent) || lastSeekPct;
            }
        };
 
        const onTouchEnd = () => {
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
            if (isSeekingProgress) {
                isSeekingProgress = false;
                commitSeek(lastSeekPct);
            }
        };
 
        document.addEventListener('touchmove', onTouchMove, {
            passive: true
        });
        document.addEventListener('touchend', onTouchEnd);
    }, {
        passive: true
    });
 
    cardProgressTrack.addEventListener('click', (e) => {
        if (!audio.src && !audio.currentSrc) return;
        const pct = seekCard(e);
        commitSeek(pct);
    });
}
 
// ─── Audio Listeners ─────────────────────────────────────────────────────────
audio.addEventListener('loadedmetadata', () => {
    if (timeTotal) timeTotal.textContent = formatTime(audio.duration);
    if (cardTimeTotal) {
        cardTimeTotal.textContent = '-' + formatTime(audio.duration);
    }
});
 
audio.addEventListener('play', () => {
    pauseIndicator.classList.remove('show');
    setFilmTracksPlayState('running');
    updatePlayButtonUI();
    document.body.classList.add('playing');
    if (!startOverlay.classList.contains('playing')) {
        startOverlay.classList.add('playing');
    }
    startOverlay.classList.remove('paused');
    if (!animFrameId) syncLoop();
});
 
audio.addEventListener('pause', () => {
    if (startOverlay.classList.contains('playing')) {
        pauseIndicator.classList.add('show');
    }
    setFilmTracksPlayState('paused');
    updatePlayButtonUI();
    document.body.classList.remove('playing');
    startOverlay.classList.add('paused');
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
});
 
audio.addEventListener('ended', () => {
    pauseIndicator.classList.remove('show');
    startOverlay.classList.remove('playing');
    startOverlay.classList.remove('paused');
    if (bottomBar) bottomBar.classList.remove('visible');
    setFilmTracksPlayState('paused');
    updatePlayButtonUI();
    document.body.classList.remove('playing');
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
    scenes.forEach(s => {
        s.el.classList.remove('scene-active');
        s.wordSpans.forEach(({
            span
        }) => {
            span.className = 'scene-word';
        });
    });
    currentActiveScene = null;
    clearSubtitleLine();
    document.querySelectorAll('.film-frame').forEach(f => f.classList.remove('active'));
});
 
audio.addEventListener('seeked', () => {
    currentActiveScene = null; // Force scene re-evaluation
});
 
// ─── Keyboard Events ─────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
    } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        audio.currentTime = Math.max(0, audio.currentTime - 5);
    } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
    } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        audio.volume = Math.min(1, audio.volume + 0.1);
    } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        audio.volume = Math.max(0, audio.volume - 0.1);
    }
});
 
// ─── Animated Favicon (Cute Retro Vinyl with Blushing Heart) ─────────────────
function initFaviconAnimation() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
 
    let faviconLink = document.querySelector("link[rel~='icon']");
    if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
    }
 
    let rotation = 0;
    let heartScale = 1;
    let pulseDirection = 1;
    let noteOffset = 0;
 
    function drawVinyl() {
        ctx.clearRect(0, 0, 32, 32);
 
        // 1. Draw outer vinyl body (charcoal color)
        ctx.fillStyle = '#18181c';
        ctx.beginPath();
        ctx.arc(16, 16, 15, 0, Math.PI * 2);
        ctx.fill();
 
        // 2. Groove lines for retro feel
        ctx.strokeStyle = '#2d2d35';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(16, 16, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(16, 16, 8, 0, Math.PI * 2);
        ctx.stroke();
 
        // 3. Draw rotating center label
        ctx.save();
        ctx.translate(16, 16);
        ctx.rotate(rotation);
 
        ctx.fillStyle = '#ff8da1';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
 
        // Spinning visual marker dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(3, 0, 1, 0, Math.PI * 2);
        ctx.fill();
 
        ctx.restore();
 
        // 4. Draw pulsing heart at center (upright, doesn't spin)
        ctx.save();
        ctx.translate(16, 16);
        ctx.scale(heartScale * 0.46, heartScale * 0.46);
 
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.bezierCurveTo(-6, -12, -14, -6, -14, 2);
        ctx.bezierCurveTo(-14, 9, -6, 15, 0, 20);
        ctx.bezierCurveTo(6, 15, 14, 9, 14, 2);
        ctx.bezierCurveTo(14, -6, 6, -12, 0, -6);
 
        ctx.fillStyle = '#ff4b81';
        ctx.fill();
 
        // Cute face details
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-3, 0, 1, 0, Math.PI * 2); // left eye
        ctx.arc(3, 0, 1, 0, Math.PI * 2); // right eye
        ctx.fill();
 
        ctx.fillStyle = '#ff8da1';
        ctx.beginPath();
        ctx.arc(-6, 2, 1.5, 0, Math.PI * 2); // left cheek
        ctx.arc(6, 2, 1.5, 0, Math.PI * 2); // right cheek
        ctx.fill();
 
        ctx.restore();
 
        // 5. Draw floating wobbly musical note ♪
        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 9px "Courier New", monospace';
        const noteX = 22 + Math.sin(noteOffset) * 2;
        const noteY = 13 - noteOffset;
        ctx.fillText('♪', noteX, noteY);
 
        faviconLink.href = canvas.toDataURL('image/png');
    }
 
    function animate() {
        // Spin record
        rotation += 0.15;
 
        // Pulse center heart
        heartScale += 0.04 * pulseDirection;
        if (heartScale >= 1.15) {
            pulseDirection = -1;
        } else if (heartScale <= 0.85) {
            pulseDirection = 1;
        }
 
        // Float musical note
        noteOffset += 0.35;
        if (noteOffset > 10) {
            noteOffset = 0;
        }
 
        drawVinyl();
        setTimeout(animate, 120); // Smooth 8 FPS loop
    }
 
    animate();
}
 
// ─── Initialization ──────────────────────────────────────────────────────────
function init() {
    initFaviconAnimation();
 
    let parsedLyrics = [];
    if (typeof window.whisperLyrics !== 'undefined' && window.whisperLyrics.length > 0) {
        parsedLyrics = window.whisperLyrics;
        console.log('✅ Loaded Whisper Lyrics source');
    } else {
        parsedLyrics = interpolateLines(FALLBACK_LINE_DATA);
        console.log('ℹ️ Loaded Interpolated Fallback Lyrics source');
    }
 
    // Dynamic splitting: if the gap between two words is > 2.2 seconds, split into a new line
    let lineIdx = 0;
    lyrics = [];
    parsedLyrics.forEach((w, i, arr) => {
        if (i > 0) {
            const prevW = arr[i - 1];
            const timeGap = w.time - prevW.time;
            if (timeGap > 2.2) {
                lineIdx++;
            } else if (w.lineIndex !== prevW.lineIndex) {
                lineIdx++;
            }
        }
        lyrics.push({
            ...w,
            lineIndex: lineIdx
        });
    });
    console.log('✅ Lyrics processed with dynamic line splitting');
 
    buildScenes();
    buildFilmStrip();
 
    // Pre-load audio as Blob URL to ensure full seek ability across all local browsers
    const defaultSrc = audio.getAttribute('src');
    if (defaultSrc && defaultSrc.trim() !== '') {
        fetch(defaultSrc)
            .then(response => response.blob())
            .then(blob => {
                audio.removeAttribute('src');
                audio.src = URL.createObjectURL(blob);
                audio.load();
                console.log('✅ Audio Blob URL created successfully');
            })
            .catch(err => {
                console.warn('⚠️ Fetching Blob failed, using direct URL source:', err);
                audio.src = defaultSrc;
            });
    }
}
 
// Run init when window loads or if already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    window.addEventListener('DOMContentLoaded', init);
}