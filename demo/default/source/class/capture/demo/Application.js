/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/* ************************************************************************

#asset(capture/demo/*)

************************************************************************ */

/**
 * This is the main application class of your custom application "capture"
 */
qx.Class.define("capture.demo.Application",
{
  extend : qx.application.Standalone,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * This method contains the initial application code and gets called 
     * during startup of the application
     * 
     * @lint ignoreDeprecated(alert)
     */
    main : function()
    {
      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;
        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      /*
      -------------------------------------------------------------------------
        Below is your actual application code...
      -------------------------------------------------------------------------
      */

      // Document is the application root
      var doc = this.getRoot();

      // Create a video capture area
      this.cap = new capture.Capture().set({
	width: 640,
	height: 480
      });
			
      // Add to document at fixed coordinates
      doc.add(this.cap, {left: 10, top: 10});

      // Create and bind buttons
      var start = new qx.ui.form.Button(this.tr("Start"));
      var stop = new qx.ui.form.Button(this.tr("Stop"));
      stop.setEnabled(false);
      var captureb = new qx.ui.form.Button(this.tr("Capture"));
      start.addListener("execute", function() {
	start.setEnabled(false);
	stop.setEnabled(true);
        this.cap.start();
      }, this);
      stop.addListener("execute", function() {
	start.setEnabled(true);
	stop.setEnabled(false);
        this.cap.stop();
      }, this);
      captureb.addListener("execute", this.__capture, this);

      doc.add(start, {left: 660, top: 10});
      doc.add(stop, {left: 660, top: 40});
      doc.add(captureb, {left: 660, top: 70});
    },

    __capture :function() {
      var image = this.cap.getImageData();

      var win = new qx.ui.window.Window(this.tr("Snapshot"));
      win.setShowMaximize(false);
      win.setShowMinimize(false);
      win.setLayout(new qx.ui.layout.VBox(10));
      win.add(new qx.ui.basic.Image(image).set({width: 640, height: 480}));
      win.open();
    }
  }
});
