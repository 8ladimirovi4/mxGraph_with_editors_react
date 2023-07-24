import React, { useEffect, useRef, useState } from "react";
import * as mxgraph from 'mxgraph';
import './scheme.css';

function Scheme1x4kПС1103510() {
  const graphContainerRef = useRef(null);
  const [scheme, setScheme] = useState(null)

  console.log(graphContainerRef.current)

  return (
    <div>
  <div id="layout" className="layout" ref={graphContainerRef}></div>
    </div>
  )
}

export default Scheme1x4kПС1103510
