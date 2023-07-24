import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout/Layout';
import Home from './Home/Home';
import Scheme1x4kПС1103510 from './Schemes/Scheme1x4kПС1103510';




function App() {
  return (
    <>
   <BrowserRouter>
   <Routes>
    <Route path='/' element={<Layout/>}>
    <Route path='/' element={<Home/>}></Route>
    <Route path='Scheme1x4kПС1103510' element={<Scheme1x4kПС1103510/>}></Route>  
    </Route>
   </Routes>
   </BrowserRouter>

    </>
  );
}

export default App;

