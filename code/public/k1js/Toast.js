import { htmlToElement } from "./utils.js";

/**
 * A simple pop up message, inspired by Android Studio's Toast. This is implemented so that it's dead simple, and you only
 * have to call .display(content) to display it.
 */
class Toast {
  constructor() {
    /** @type {number} this.instances */ this.instances = 0; // this is so that only the latest call's turnOff() will actually turn it off
    /** @type {jQuery} this.objectReference */ this.objectReference = document.querySelector("#toast");
  }

  /**
   * Displays toast with content.
   *
   * @param content
   * @param {number} timeout Optional time out. Defaults to 3 seconds.
   */
  display(content, timeout = 3000) {
    this.instances++;
    this.objectReference.innerHTML = content;
    this.objectReference.classList.add("activated");
    setTimeout(this.turnOff, timeout);
  }

  displayOfflineMessage = (content) => this.display(content + " Please check your internet connection, or report an issue");
  /** Displays a message, and keeps it online until another display() is called. */
  persistTillNextDisplay = (content) => ((this.objectReference.innerHTML = content), this.objectReference.classList.remove("activated"));
  /** Fades out the toast. Expected to be called by a timeout only. */
  turnOff = () => (toast.instances === 1 ? toast.objectReference.classList.remove("activated") : "", toast.instances--);
}

document.body.append(htmlToElement(`<div id="toast"></div>`));
document.body.append(
  htmlToElement(`
<style>
    #toast {
        position: fixed;
        max-width: 40vw;
        top: 70vh;
        left: 50vw;
        transform: translateX(-50%);
        background-color: #f0e68cff;
        opacity: 0;
        color: #111111ff;
        transition: opacity 0.3s;
        text-align: center;
        padding: 8px 30px;
        font-size: 1.5em;
        z-index: 50000;
        border-radius: 32px;
        color: #111111 !important;
        pointer-events: none;
        user-select: none;
    }
    
    @media only screen and (max-width: 600px) {
        #toast {
            top: unset;
            max-width: unset;
            transform: unset;
            border-radius: unset;
            font-size: 1em;
            width: 100vw;
            bottom: 0;
            left: 0;
        }
    }
    
    #toast.activated {
        opacity: 1;
    }
</style>
`)
);

/** @type {Toast} toast */ export const toast = new Toast();
