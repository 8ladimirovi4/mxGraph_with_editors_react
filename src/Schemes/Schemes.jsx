import React, { useEffect, useRef } from "react";
import './scheme.css';
import '../Css/scheme.css';
import '../Css/view.css'
import '../Css/common.css'
import { Graph } from '../Js/Patch'
import { EditorUi } from '../Js/Patch'
import { Editor } from '../Js/Patch'
import * as mxgraph from 'mxgraph';
import 'webix/webix.css';
import { useSelector } from "react-redux";

const { 
  mxClient, 
  mxUtils, 
  mxResources, 
} = mxgraph();

function Schemes() {

  const formRef = useRef(null);
  const link = useSelector(state => state.links.link)

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
        if(link){
        const response = await  fetch(`/assets/${link}.txt`)
        const text = await response.text();

        const r = {
          id: '2251b1c0-f0a3-4979-99c3-caa251ff3cd2',
          model: text,
          name: '1x4kПС-1103510',
          version: '3.0',
        };
        buildViewer(r);
      }
      };
      LoadGraph();

  }, [link]);

  return (
    <>
{link 
  ?
  <div key={new Date()} className='geViewer' id="viewer" ref={formRef}> </div>
  :
  <div key={new Date()} ><b>Выберете схему</b></div>
}
</>
  )
};

export default Schemes
