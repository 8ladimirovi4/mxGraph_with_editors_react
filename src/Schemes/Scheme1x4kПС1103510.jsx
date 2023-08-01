import React, { useEffect, useRef } from "react";
import './scheme.css';
import '../Css/scheme.css';
import '../Css/view.css'
import '../Css/common.css'
import { Graph, EditorUi, Editor } from '../Js/Patch'
import * as mxgraph from 'mxgraph';
import * as webix from 'webix/webix.js';
import 'webix/webix.css';


const { 
  mxClient, 
  mxUtils, 
  mxResources, 
} = mxgraph();

function Scheme1x4kПС1103510() {

  const formRef = useRef(null);
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
    
        themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement();
        // Build viewer
        window.viewer = new EditorUi(new Editor(true, themes), formRef.current, scheme);
      },
      function () {
       console.log('Ошибка загрузки ресурсных файлов.');
      });
    };

      if (!window.mxClient) return;

      if (!mxClient.isBrowserSupported()) {
        console.log('Извините! Ваш браузер не поддерживается.');
        return;
      }

      const LoadGraph = async () => {
        const response = await  fetch('/assets/ПС-110-35-10.txt')
        const text = await response.text();

        const r = {
          id: '2251b1c0-f0a3-4979-99c3-caa251ff3cd2',
          model: text,
          name: '1x4kПС-1103510',
          version: '3.0',
        };
        buildViewer(r);
      };
      LoadGraph();

  }, []);

  return <div className='geViewer' id="viewer" ref={formRef}> </div>;
};

export default Scheme1x4kПС1103510
