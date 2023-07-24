import React from 'react'
import {Link, Outlet} from 'react-router-dom'
import './layout.css'

function Layout() {
  return (
    <>
    <div className='header'>
        <Link to='/'>Home</Link>{" "}
        <Link to='Scheme1x4kПС1103510'>1x4kПС-1103510</Link>
        
        </div> 

       <div className="body">
        <Outlet/>
       </div>

       <div className="footer"></div>
        </>
  )
}

export default Layout
