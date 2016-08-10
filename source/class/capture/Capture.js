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


/**
 * This is the main class of contribution "capture"
 *
 * @lint ignoreUndefined(windowURL)
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
    },

    captureSizeX :
    {
      check : "Integer",
      init : 200
    },

    captureSizeY :
    {
      check : "Integer",
      init : 200
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
    this.base(arguments, new qx.ui.layout.Canvas());
    this.setBackgroundColor('black');
    this.setDecorator('main');
    this.__stream = null;

    // Create video element
    var video = new qx.bom.media.Video();
    video.setAutoplay(true);
    video.addListener("loadeddata", function() {
      this.getContentElement().getDomElement().appendChild(video.getMediaObject());
      qx.bom.element.Transform.scale(this.getContentElement().getDomElement(), [-1, 1]);
      this._updateCaptureArea();
    }, this);
    this.__video = video;

    // Create still image capturing area
    this.__canvas = new qx.html.Canvas();
    this.__context = this.__canvas.getContext2d();

    // Resize handling
    this.addListener("resize", this.__resize, this);
    this.__resize();

    // Create border which frame the resulting image
    var border_left = this._bleft = new qx.ui.container.Composite();
    var border_right = this._bright = new qx.ui.container.Composite();
    border_left.setBackgroundColor("#000000");
    border_right.setBackgroundColor("#000000");
    border_left.setOpacity(0.5);
    border_right.setOpacity(0.5);
    border_left.setWidth(40);
    border_right.setWidth(40);
    this.add(border_left);
    this.add(border_right, {right:0});

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

    _bleft: null,
    _bright: null,
   __canvas: null,
   __context: null,
   __msg: null,
   __stream: null,
   __video: null,


    /* Returns calculated image details, like clipping and the source dimensions
     * to use while generating the resulting image.
     * */
    _imageDetails: function(){
      var width = this.getCaptureSizeX();
      var height = this.getCaptureSizeY();
      var s_ratio = this.__video.getVideoWidth() / this.__video.getVideoHeight();
      var d_ratio = width / height;
      var new_width = (this.__video.getVideoWidth() / (s_ratio/d_ratio));
      var x_clip = (this.__video.getVideoWidth() - new_width) / 2;
      return({'width': new_width, 'height': this.__video.getVideoHeight(), 'x_clip': x_clip}); 
    },


    /**
     * Set the width of the capture frame
     * */
    _updateCaptureArea: function(){
      var x_clip = this._imageDetails()['x_clip'];
      var scale = this.getWidth() / this.__video.getVideoWidth();
      this._bleft.setWidth(x_clip * scale);
      this._bright.setWidth(x_clip * scale);
      this._bleft.setHeight(this.getHeight());
      this._bright.setHeight(this.getHeight());
    },

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
          that.__stop();
        };
      
        stream.onended = function(e) {
          that.fireEvent("stop"); 
        };
      
        that.getContentElement().getDomElement().appendChild(that.__video.getMediaObject());
        that.__stream = stream;
        that.fireEvent("start"); 
      }, function(){
        that.__msg.setValue(this.tr("Error capturing the video stream!"));
        that.__msg.show();
        that.__stop();
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

      var msTracks = this.__stream.getTracks();
      for (var track in msTracks){
        msTracks[track].stop();
      }

      this.__stream = null;
    },

    /**
     * Returns the image data as a data URL.
     *
     * @param format {string} Format to use for the export. Defaults to 'jpeg'.
     *
     * @return {string} Data URL of the image.
     */
    getImageData : function(format){
      // Retrieve the current image as jpeg (default)
      if (!format) {
        format = 'jpeg';
      }

      var width = this.getCaptureSizeX();
      var height = this.getCaptureSizeY();
      this.__canvas.setWidth(width);
      this.__canvas.setHeight(height);

      var details = this._imageDetails();
      this.__context.drawImage(this.__video.getMediaObject(), details['x_clip'], 0, details['width'], details['height'], 0, 0, width , height);
      return this.__canvas.getCanvas().toDataURL('image/' + format);
    },

    /**
     * Returns true or false depending on the availibility of life video
     * capturing.
     *
     * @return {boolean}
     */  
    isSupported : function() {
        return navigator.mediaDevices.getUserMedia != undefined || navigator.webkitGetUserMedia != undefined;
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
    },

    /**
     * Wrap getUserMedia to be a bit more browser independent. Could
     * use qx.bom.client later on.
     */
    __getUserMedia : function(props, success, error) {
      if (navigator.webkitGetUserMedia) {
        return navigator.webkitGetUserMedia(props, success, error);
      } else if (navigator.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(props, success, error);
      } else {
        return undefined; 
      }
    }

  }

});
