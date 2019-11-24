
import './src/polyfill/css.js';

import santaStyles from './styles/santa.css';
import fallbackStyles from './styles/fallback.css';
document.adoptedStyleSheets = [santaStyles, fallbackStyles];

import {createFrame} from './src/elements/santa-gameloader.js';
import * as messageSource from './src/lib/message-source.js';


import {buildLoader} from './src/core/loader.js';
import {configureProdRouter, globalClickHandler} from './src/core/router.js';


const homeButton = document.createElement('button');
homeButton.className = 'home';
homeButton.disabled = true;
document.body.append(homeButton);


const errorElement = document.createElement('div');
errorElement.className = 'error';
document.body.append(errorElement);


let activeFrame = createFrame();
let previousFrame = null;
document.body.append(activeFrame);



const fallbackLoad = (url, {route, data, locked}) => {
  const frame = createFrame(url);
  frame.classList.add('pending');
  document.body.append(frame);
  document.body.classList.add('loading');
  homeButton.disabled = !route;  // show home button on non-"/" pages

  if (previousFrame) {
    activeFrame.dispatchEvent(new CustomEvent('-removed'));
    activeFrame.remove();  // new activeFrame hasn't loaded yet
  } else {
    previousFrame = activeFrame;
    previousFrame.setAttribute('tabindex', -1);
    window.focus();
  }

  activeFrame = frame;

  const loaded = (port) => {
    frame.classList.remove('pending');
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');

    const local = previousFrame;
    local.classList.add('pending');
    window.setTimeout(() => {
      local.remove();
    }, 250);
    previousFrame = null;

    if (port) {
      runner(port);
    } else {
      frame.remove();  // should == activeFrame
      failedToLoad();
    }
  };

  if (!url) {
    // successfully loaded nothing!
    loaded(null);
    return Promise.resolve(true);
  }

  const portPromise = new Promise((resolve) => {
    messageSource.add(activeFrame.contentWindow, (ev) => {
      const port = ev.ports[0];
      if (!port) {
        throw new Error(`didn't get port from contentWindow`);
      }
      resolve(port);
    });
    activeFrame.addEventListener('-removed', (ev) => resolve(null));
    activeFrame.addEventListener('load', () => {
      // Unlike modern browsers, Edge/IE seems to not get this for a while.
      console.warn('load timeout', url);
      window.setTimeout(() => resolve(null), 10 * 1000);
    });
  });

  return portPromise.then((port) => {
    if (activeFrame !== frame) {
      return false;  // preempted, do literally nothing
    } else if (!port) {
      loaded(null);
      return false;
    }

    // send ?foo=.. data
    port.postMessage({type: 'data', payload: data});

    return new Promise((resolve) => {
      port.onmessage = (ev) => {
        const {type, payload} = ev.data;
        switch (type) {
          case 'preload':
            // TODO(samthor): This is fragile.
            const [preloadType, event, responsePort] = payload;
            responsePort.postMessage(null);
            return;
  
          case 'loaded':
            loaded(port);
            resolve(true);
            return;
        }
      };
    });
  });
};


const {scope, go, write} = configureProdRouter(buildLoader(fallbackLoad, true));
document.body.addEventListener('click', globalClickHandler(scope, go));


homeButton.addEventListener('click', (ev) => go(''));


function runner(port) {
  let recentScore = {};

  port.postMessage({type: 'ready'});
  port.postMessage({type: 'resume'});

  port.onmessage = (ev) => {
    const {type, payload} = ev.data;

    switch (type) {
      case 'score':
        recentScore = payload;
        return;

      case 'gameover':
        console.warn('got gameover', recentScore);
        go('');
        return;

      case 'ga':
        ga.apply(null, payload);
        return;

      case 'go':
        go(payload);
        return;

      case 'data':
        write(payload);
        return;
    }
  };
}


function failedToLoad() {
  // TODO(samthor): Do anything at all?
}

