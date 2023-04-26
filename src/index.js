export default (data) => {
  const el = document.getElementById(`inset-${data.uuid}`);
  //console.log(data.uuid);
  const eWrapper = el.querySelector('.ac-wrapper');

  const eSpectrograms = eWrapper.querySelector('.ac-spectograms');
  const eWakeUpPlayButton = eWrapper.querySelector('.ac-play');
  const eplayer0 = eWrapper.querySelector('.ac-player0');
  const eAudio0 = eWrapper.querySelectorAll('audio')[0];

  const eAudio1 = eWrapper.querySelectorAll('audio')[1];
  const eSlider = eWrapper.querySelector('.ac-slider');
  const eDial = eSlider.querySelector('.ac-dial');
  const eToggle = eWrapper.querySelector('.ac-toggle-container');
  const ealbum0 = eWrapper.querySelectorAll('.ac-album')[0];
  ealbum0.classList.add('ac-album-0');
  const ealbum1 = eWrapper.querySelectorAll('.ac-album')[1];
  ealbum1.classList.add('ac-album-1');  
  eWrapper.querySelectorAll('.ac-player')[0].classList.add('ac-player0');
  eWrapper.querySelectorAll('.ac-player')[1].classList.add('ac-player1');

  const eButtonPlayPause = eWrapper.querySelector('.ac-control-play-pause');
  const eButtonRewind = eWrapper.querySelector('.ac-control-rewind');
  const eButtonLoop = eWrapper.querySelector('.ac-control-loop');
  const eTime = eWrapper.querySelector('.ac-control-time');
  const eTotalTime = eWrapper.querySelector('.ac-control-total-time');

  window.pauseothers = '';
  const id = data.id;
  let adjustedDuration = 0;
  let dimensions = { wrapperWidth: 0 };

  

  const isiOS = () => {
    return (
      [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod',
      ].includes(navigator.platform) ||
      // iPad on iOS 13 detection
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    );
  };

  const isSafari = () => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  };



  eWrapper.classList.add('ac-no-annotations');
  const singlePlayer =
    eSpectrograms.querySelectorAll('.ac-player').length === 1;
  if (!singlePlayer) {
    eWrapper.classList.add('ac-dual');
  } else {
    eWrapper.classList.add('ac-single');
  }
  const getAbsPos = (e) => {
    let top = 0;
    let left = 0;
    while (e != null) {
      top += e.offsetTop;
      left += e.offsetLeft;
      e = e.offsetParent;
    }
    return { top, left };
  };



  const prettyfyTime = (seconds) => {
    return new Date(seconds * 1000).toISOString().substr(14, 5);
  };
  const disableSliderAni = () => {
    eSpectrograms.classList.remove('ac-ani');
    window.setTimeout(() => {
      eSpectrograms.classList.add('ac-ani');
    }, 50);
  };

  const changeAudio = (whichOne) => {
    if (whichOne === activeAudio) return;
    eWrapper.classList.add('ac-user-interacted');
    if (!singlePlayer) {
      if (whichOne === 0) {
        eToggle.classList.remove('ac-toggle-on');
      } else {
        eToggle.classList.add('ac-toggle-on');
      }
    }
    if (state !== 'idle') {
      if (activeAudio === 0) {
        const time = audio0.e.currentTime;
        if (usingVolume) {
          eAudio0.volume = 0;
          eAudio1.volume = 1;
        } else {
          pauseAudio(0);
          setAudioTime(1, time + 0.2 + audio1.timeOffset);
          playAudio(1);
        }
      } else {
        const time = audio1.e.currentTime;
        if (usingVolume) {
          eAudio0.volume = 1;
          eAudio1.volume = 0;
        } else {
          pauseAudio(1);
          setAudioTime(0, time + 0.2 - audio1.timeOffset);
          playAudio(0);
        }
      }
    }
    activeAudio = whichOne;
    updateClasses();
  };
  const playAudio = (n) => {
    if (n === 0) {
      eAudio0.play();
    } else {
      if (!singlePlayer) eAudio1.play();
    }
  };
  const pauseAudio = (n) => {
    if (n === 0) {
      audio0.e.pause();
    } else {
      if (!singlePlayer) audio1.e.pause();
    }
  };
  const setAudioTime = (n, time) => {
    if (n === 0) {
      eAudio0.currentTime = time;
    } else {
      if (!singlePlayer) eAudio1.currentTime = time;
    }
  };
  const rewindToOffset = () => {
    setAudioTime(0, audio0.timeOffset);
    if (!singlePlayer) {
      setAudioTime(1, audio1.timeOffset);
    }
  };
  const play = () => {
    if (state === 'idle') {
      rewindToOffset();
    }
    state = 'playing';
    window.pauseothers = id;
    if (activeAudio === 0) {
      if (usingVolume) {
        eAudio0.volume = 1;
        if (!singlePlayer) eAudio1.volume = 0.05;
        playAudio(0);
        playAudio(1);
      } else {
        playAudio(0);
      }
    } else {
      if (usingVolume) {
        eAudio0.volume = 0.05;
        eAudio1.volume = 1;
        playAudio(0);
        playAudio(1);
      } else {
        playAudio(1);
      }
    }
    updateClasses();
  };
  const stop = () => {
    state = 'idle';
    setAudioTime(0, 0);
    setAudioTime(1, 0);
    pauseAudio(0);
    pauseAudio(1);
    wait = true;
    updateClasses();
  };
  const playPause = () => {
    if (state === 'playing') {
      pause();
    } else {
      play();
    }
  };
  const pause = () => {
    state = 'paused';
    eWrapper.classList.add('ac-paused');
    eAudio0.pause();
    if (!singlePlayer) eAudio1.pause();
  };
  const wakeUp = () => {
    play();
    window.setTimeout(() => {
      wait = false;
    }, 500);
  };
  const updateClasses = () => {
    eWrapper.classList.add(`ac-enabled-audio${activeAudio}`);
    eWrapper.classList.remove(`ac-enabled-audio${activeAudio === 0 ? 1 : 0}`);
    if (state === 'playing') {
      eWrapper.classList.remove('ac-idle');
      eWrapper.classList.add('ac-playing');
      eSpectrograms.classList.add('ac-ani');
      eWrapper.classList.remove('ac-seeking');
      eWrapper.classList.remove('ac-paused');
    }
    if (state === 'paused') {
      eWrapper.classList.remove('ac-idle');
      eWrapper.classList.remove('ac-playing');
      eWrapper.classList.remove('ac-paused');
      eSpectrograms.classList.add('ac-ani');
      eWrapper.classList.remove('ac-seeking');
    }
    if (state === 'idle') {
      eWrapper.classList.add('ac-idle');
      eWrapper.classList.remove('ac-playing');
      eWrapper.classList.remove('ac-paused');
      eSpectrograms.classList.remove('ac-ani');
      eWrapper.classList.remove('ac-seeking');
    }
    if (state === 'seeking') {
      eWrapper.classList.add('ac-seeking');
      eWrapper.classList.remove('ac-paused');
    }
  };



  const updateTime = (audio) => {
    if (window.pauseothers !== '') {
      if (window.pauseothers !== id) {
        pause();
      }
    }
    const currentTime = audio.e.currentTime;
    audio.time = currentTime;
    eTime.innerHTML = prettyfyTime(audio.time - audio.timeOffset);
    audio.percent = ((audio.time - audio.timeOffset) * 100) / adjustedDuration;
    eDial.style.left = `${audio.percent}%`;
  };
  const updateSpectrogramProps = () => {
    spectograms = {
      top: getAbsPos(eSpectrograms).top,
      left: getAbsPos(eSpectrograms).left,
      width: eSpectrograms.offsetWidth,
      height: eSpectrograms.offsetHeight,
    };
  };
  const getDuration = (audio) => {
    audio.e.addEventListener(
      'loadedmetadata',
      () => {
        // Obtain the duration in seconds of the audio file (with milliseconds as well, a float value)
        audio.duration = audio.e.duration;
        isInit = true;
        if (audio.e.dataset.timeOffset) {
          audio.timeOffset = parseFloat(audio.e.dataset.timeOffset);
        } else {
          audio.timeOffset = 0;
        }
        adjustedDuration = audio.duration - audio.timeOffset;

        if (!singlePlayer) {
          if (audio0.duration && audio1.duration) {
            adjustedDuration = Math.min(
              audio0.duration - audio0.timeOffset,
              audio1.duration - audio1.timeOffset
            );
          }
        }
        eTotalTime.innerHTML = prettyfyTime(adjustedDuration);

        updateSpectrogramProps();
        if (singlePlayer) {
          if (audio0.duration) {
            eWrapper.classList.remove('ac-loading');
          }
        } else {
          if (audio0.duration && audio1.duration) {
            eWrapper.classList.remove('ac-loading');
          }
        }
      },
      false
    );
    audio.e.addEventListener('timeupdate', (e) => {
      if (state === 'idle') return;
      updateTime(audio);
      // reached end of audio
      if (audio.e.currentTime > audio.duration - 0.5) {
        if (isLoop) {
          rewindToOffset();
          play();
        } else {
          stop();
        }
      }
    });
  };

  // interactions

  eWakeUpPlayButton.addEventListener(
    // click on big fat play button
    'click',
    () => {
      if (!isInit || state !== 'idle') return;
      wakeUp();
    },
    false
  );

  eSpectrograms.addEventListener(
    // seeking
    'mousemove',
    (e) => {
      mouse.left = e.pageX - spectograms.left;
      mouse.percentX = (mouse.left * 100) / spectograms.width;
      mouse.top = e.pageY - spectograms.top;
      mouse.percentY = (mouse.top * 100) / spectograms.height;
      if (isSeeking) {
        eDial.style.left = `${mouse.percentX}%`;
      }
    },
    false
  );
  eSpectrograms.addEventListener(
    // end seeking
    'mouseup',
    (e) => {
      isSeeking = false;
      if (state === 'idle' || wait) return;
      // don't seek if user clicked the another spectogram
      if (!singlePlayer) {
        if (activeAudio === 0 && mouse.percentY > 50) {
          changeAudio(1);
          return;
        }
        if (activeAudio === 1 && mouse.percentY < 50) {
          changeAudio(0);
          return;
        }
      }
      disableSliderAni();
      const newPosition0 =
        (adjustedDuration * mouse.percentX) / 100 + audio0.timeOffset;
      setAudioTime(0, newPosition0);
      if (!singlePlayer) {
        const newPosition1 =
          (adjustedDuration * mouse.percentX) / 100 + audio1.timeOffset;
        setAudioTime(1, newPosition1);
      }
      play();
    },
    false
  );
  eSpectrograms.addEventListener(
    // detect seek start
    'mousedown',
    (e) => {
      // ignore if user clicked the another spectogram
      if (
        state === 'idle' ||
        (activeAudio === 0 && mouse.percentY > 50) ||
        (activeAudio === 1 && mouse.percentY < 50)
      ) {
        return;
      }
      eSpectrograms.classList.remove('ac-ani');
      eAudio0.pause();
      if (!singlePlayer) eAudio1.pause();
      eWrapper.classList.add('ac-seeking');
      state = 'seeking';
      isSeeking = true;
    },
    false
  );

  ealbum0.addEventListener(
    'click',
    () => {
      changeAudio(0);
    },
    false
  );
  if (!singlePlayer) {
    ealbum1.addEventListener(
      'click',
      () => {
        changeAudio(1);
      },
      false
    );
  }
  const swapAudio = () => {
    changeAudio(activeAudio === 1 ? 0 : 1);
  };

  eToggle.addEventListener(
    'click',
    () => {
      swapAudio();
    },
    false
  );
  // bottom control bar buttons

  eButtonLoop.addEventListener(
    'click',
    () => {
      isLoop = !isLoop;
      if (isLoop) {
        eWrapper.classList.add('ac-loop');
      } else {
        eWrapper.classList.remove('ac-loop');
      }
    },
    false
  );
  eButtonPlayPause.addEventListener(
    'click',
    () => {
      playPause();
    },
    false
  );
  eButtonRewind.addEventListener(
    'click',
    () => {
      rewindToOffset();
    },
    false
  );

  const getPercent = (time) => {
    return (100 * time) / adjustedDuration;
  };
  const getOffsetPixels = (time) => {
    return (dimensions.wrapperWidth * time) / adjustedDuration;
  };


  // init

  let spectograms = {
    e: eSpectrograms,
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  };

  let usingVolume = !isiOS();
  let activeAudio = singlePlayer ? 0 : 1;
  let isLoop = false;
  let isSeeking = false;

  let mouse = { left: 0, percentX: 0 };
  let state = 'idle';
  let isInit = false;
  let wait = true;
  let audio0 = {};
  let audio1 = {};
  let bodyHeight = 0;

  audio0.e = eAudio0;
  audio0.src = eAudio0.src;
  getDuration(audio0);
  if (!singlePlayer) {
    audio1.e = eAudio1;
    audio1.src = eAudio1.src;
    getDuration(audio1);
  }

  window.setInterval(() => {

    if (document.body.offsetHeight !== bodyHeight) {
      updateSpectrogramProps();

      bodyHeight = document.body.offsetHeight;
    }
  }, 1000);
};
