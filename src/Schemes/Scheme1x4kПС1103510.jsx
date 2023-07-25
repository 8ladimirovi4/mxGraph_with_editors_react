import React, { useEffect, useRef, useState } from "react";
import * as mxgraph from 'mxgraph';
import './scheme.css';
import * as webix from 'webix/webix.js';
const { mxClient, mxUtils, mxResources} = mxgraph();

function Scheme1x4kПС1103510() {

 
  const [schemeUI, setSchemeUI] = useState(null);
  const formRef = useRef();

  useEffect(() => {

   
    const buildViewer = (scheme) => {
      mxResources.loadDefaultBundle = false;
      var bundle =
        mxResources.getDefaultBundle('/thirdparty/mxgraph/editor/i18n/scheme', ['ru', 'en', 'fr']) ||
        mxResources.getSpecialBundle('/thirdparty/mxgraph/editor/i18n/scheme', ['ru', 'en', 'fr']);

      var themes = new Object();
      mxUtils.getAll([bundle, '/thirdparty/mxgraph/editor/res/default.xml'], function (xhr) {
        // Adds bundle text to resources
        mxResources.parse(xhr[0].getText());
        // Configures the default graph theme
        console.log(Graph.prototype.defaultThemeName)
        themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement();
        // Build viewer
        window.viewer = new EditorUi(new Editor(true, themes), document.getElementById('viewer'), scheme);
      },
      function () {
       console.log('Ошибка загрузки ресурсных файлов.');
      });
    };

    const buildComplete = (result) => {
      webix.ui(result);
      buildTemplateComplete();
    };

    const buildPageLayout = (complete) => {

      let schemeUI = webix.ui({
        // id: 'contentview',
        container: formRef.current,
        type: 'clean',
        template: "<div class='geViewer' id='viewer'></div>",
      });
      webix.require(
        [
          '/thirdparty/signalr/signalr.min.js',
          'thirdparty/mxgraph/deflate/base64.js',
          'thirdparty/mxgraph/deflate/pako.min.js',
          'thirdparty/mxgraph/jscolor/jscolor.js',
          'thirdparty/mxgraph/sanitizer/sanitizer.min.js',
          'thirdparty/charts/Chart.bundle.min.js',
          'thirdparty/charts/plugins/chartjs-plugin-annotation.min.js',
          'thirdparty/charts/Chart.min.css',
          'scripts/css/view.css',
          'scripts/css/scheme.css',
          'scripts/scada.js',
          '/thirdparty/mxgraph/mxClient.min.js',
          '/thirdparty/mxgraph/editor/Init.js',
          '/thirdparty/mxgraph/editor/EditorUi.js',
          '/thirdparty/mxgraph/editor/Editor.js',
          '/thirdparty/mxgraph/editor/Sidebar.js',
          '/thirdparty/mxgraph/editor/Graph.js',
          '/thirdparty/mxgraph/editor/Shapes.js',
          '/thirdparty/mxgraph/editor/Bindings.js',
          '/thirdparty/mxgraph/editor/Actions.js',
          '/thirdparty/mxgraph/editor/Menus.js',
          '/thirdparty/mxgraph/editor/Dialogs.js',
          '/thirdparty/mxgraph/editor/ViewMode.js',
          '/thirdparty/mxgraph/editor/Scripts.js',
          '/thirdparty/mxgraph/editor/MarksService.js',
        ],
        function () {
          if (complete) complete(schemeUI);
        }
      );
    };

    const buildTemplateComplete = () => {
      if (!window.mxClient) return;

      if (!mxClient.isBrowserSupported()) {
        console.log('Извините! Ваш браузер не поддерживается.');
        return;
      }

      const LoadGraph = async () => {
        const response = await  fetch('/assets/1x4kПС-1103510.txt')
        const text = await response.text();

        const r = {
          id: '2251b1c0-f0a3-4979-99c3-caa251ff3cd2',
          model: text,
          name: '1x4kПС-1103510',
          version: '3.0',
        };
        buildViewer.apply(window, [r]);
      };
      LoadGraph();
    };

    

    buildPageLayout(buildComplete);
    // return () => {
    //   schemeUI.destructor();
    // };
   
  }, []);

  return <div id="layout" ref={formRef}> </div>;
};

export default Scheme1x4kПС1103510
