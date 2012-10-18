/* ************************************************************************

   Copyright:
     2012 GONICUS GmbH, http://www.gonicus.de
     
   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Cajus Pollmeier (pollmeier@gonicus.de)

************************************************************************ */

/**
 * A image capture widget with live video display.
 *
 * The intended purpose of capture.Capture is to easily acquire a still
 * image using the internal video device of the users system. It provides
 * the image data for further reference.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *   var cap = new capture.Capture().set({width: 640, height: 480});
 *   this.getRoot().add(atom);
 *   cap.start();
 *
 *   setTimeout(function() {
 *     console.log(cap.getImageData());
 *   }, 1000);
 * </pre>
 *
 * This example creates a video view, captures a still image after a
 * second and prints the raw image data to the console.
 *
 * @childControl error-label {qx.ui.basic.Label} label containing the error message
 */

/*
#ignore(windowURL)
 */


/**
 * This is the main class of contribution "capture"
 */
qx.Class.define("capture.Capture",
{
  extend : qx.ui.container.Composite,

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    error :
    {
      apply : "_applyError",
      nullable : true,
      check : "String",
      event : "changeError"
    }

  },

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Create a video view/capture widget.
   */
  construct : function() 
  {
    this.base(arguments, new qx.ui.layout.HBox().set({alignY: 'middle', alignX: 'center'}));
    this.setBackgroundColor('black');
    this.setDecorator('main');
    this.__stream = null;

    // Create video element
    var video = new qx.bom.media.Video();
    video.setAutoplay(true);
    video.addListener("loadeddata", function() {
      this.getContentElement().getDomElement().appendChild(video.getMediaObject());
    }, this);
    this.__video = video;

    // Create still image capturing area
    this.__canvas = new qx.html.Canvas();
    this.__context = this.__canvas.getContext2d();

    // Resize handling
    this.addListener("resize", this.__resize, this);
    this.__resize();

    // Check if getUserMedia is supported
    if (!this.isSupported()) {
      this.setError(this.tr("Capturing videos is not supported on this system."));
    }
  },

  events :
  {
    /**
     * Fired after the widget has started with capturing.
     */
    "start" : "qx.event.type.Event",

    /**
     * Fired after the widget has stopped with capturing.
     */
    "stop" : "qx.event.type.Event"
  },

  members : {

    /**
     * Start life video capturing.
     */
    start : function() {
      var that = this;

      // Ignore start if we're already running
      if (this.__stream) {
        return;
      }

      this.__getUserMedia({video: true}, function(stream) {
        windowURL = window.URL || window.webkitURL;

        if (windowURL) {
          that.__video.setSource(windowURL.createObjectURL(stream));
        } else {
          that.__video.setSource(stream); // Opera.
        }
      
        that.__video.onerror = function(e) {
          that.__msg.setValue(this.tr("Error capturing the video stream!"));
          that.__msg.show();
          stream.stop();
        };
      
        stream.onended = function(e) {
          that.fireEvent("stop"); 
        };
      
        that.getContentElement().getDomElement().appendChild(that.__video.getMediaObject());
        that.__stream = stream;
        that.fireEvent("start"); 
      });
    },

    /**
     * Stop life video capturing.
     */
    stop : function() {
      // Ignore stop if we're not running
      if (!this.__stream) {
        return;
      }

      this.__stream.stop();
      this.__stream = null;
    },

    /**
     * Returns the image data as a data URL.
     *
     * @param format {string} Format to use for the export. Defaults to 'jpeg'.
     *
     * @return {string} Data URL of the image.
     */
    getImageData : function(format, x, y, width, height, sx, sy, swidth, sheight) {
      // Retrieve the current image as jpeg (default)
      if (!format) {
        format = 'jpeg';
      }

      this.__context.drawImage(this.__video.getMediaObject(), x, y, width, height, sx, sy, swidth, sheight);

      return this.__canvas.getCanvas().toDataURL('image/' + format);
    },

    /**
     * Returns true or false depending on the availibility of life video
     * capturing.
     *
     * @return {boolean}
     */  
    isSupported : function() {
        return navigator.getUserMedia != undefined || navigator.webkitGetUserMedia != undefined;
    },

    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        case "error-label":
          control = new qx.ui.basic.Label(this.getError());
          control.setAnonymous(true);
          control.setTextColor("white");
          this._add(control);
          if (this.getError() == null) {
            control.exclude();
          }
          break;
      }

      return control || this.base(arguments, id);
    },

    /**
     * Updates the visibility of the error label
     */
    _handleErrorLabel : function()
    {
      if (this.getError() == null) {
        this._excludeChildControl("error-label");
      } else {
        this._showChildControl("error-label");
      }
    },

    /**
     * Applies the error property
     */
    _applyError : function(value, old)
    {
      var label = this.getChildControl("error-label", true);
      if (label) {
        label.setValue(value);
      }

      this._handleErrorLabel();
    },

    /**
     * Resize all relevant containers
     */
    __resize : function() {
      this.__video.setWidth(this.getWidth());
      this.__video.setHeight(this.getHeight());
      this.__canvas.setWidth(this.getWidth());
      this.__canvas.setHeight(this.getHeight());
    },

    /**
     * Wrap getUserMedia to be a bit more browser independent. Could
     * use qx.bom.client later on.
     */
    __getUserMedia : function(props, callback) {
      if (navigator.webkitGetUserMedia) {
        return navigator.webkitGetUserMedia(props, callback)
      } else if (navigator.getUserMedia) {
        return navigator.getUserMedia(props, callback)
      } else {
        return undefined; 
      }
    }

  }

});
