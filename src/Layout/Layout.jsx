import { useEffect, useState } from "react";
import React from 'react'
import {Link, Outlet} from 'react-router-dom'
import './layout.css'
import { useDispatch } from "react-redux";
import { setLink } from "../Redux/Reducers/linksReducer";

const mok = [
  {id: 1, name: '1x4kПС-1103510'},
  {id: 2, name: 'buttons'},
  {id: 3, name: 'ПС-110-35-10'}
  ]

function Layout() {
  const dispatch = useDispatch()
  const [links, setLinks] = useState([])

  useEffect(() => {
    setLinks(mok)
  },[])

  return (
    <>
    <div className='header'>
        <Link to='/'>Home</Link>{" "}
        { links && links.map((link, index) => (
          <div key={index}>
       <Link to='Schemes' onClick={() => {dispatch(setLink(link.name))}}>{link.name} </Link>
       </div>
      ))}
        
        </div> 

       <div className="body">
        <Outlet/>
       </div>

       <div className="footer"></div>
        </>
  )
}

export default Layout
