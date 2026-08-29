/**
 * MUSIC.JS - Controls background audio play / pause & button state
 */
const MusicController = {
    audio: null,
    btn: null,
    isPlaying: false,

    init: function() {
        this.audio = document.getElementById('bg-music');
        this.btn = document.getElementById('music-toggle');

        if (this.btn && this.audio) {
            this.btn.addEventListener('click', () => this.toggle());
        }
    },

    play: function() {
        if (!this.audio) return;
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updateIcon();
        }).catch((err) => {
            console.log("Autoplay prevented or audio file missing: ", err);
            this.isPlaying = false;
            this.updateIcon();
        });
    },

    pause: function() {
        if (!this.audio) return;
        this.audio.pause();
        this.isPlaying = false;
        this.updateIcon();
    },

    toggle: function() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    },

    updateIcon: function() {
        if (!this.btn) return;
        const icon = this.btn.querySelector('i');
        if (this.isPlaying) {
            icon.classList.add('fa-spin-music');
            this.btn.style.color = '#c5a880';
        } else {
            icon.classList.remove('fa-spin-music');
            this.btn.style.color = '#a0aec0';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => MusicController.init());
