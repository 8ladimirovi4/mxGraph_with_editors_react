import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout/Layout';
import Home from './Home/Home';
import Schemes from './Schemes/Schemes';




function App() {
  return (
    <>
   <BrowserRouter>
   <Routes>
    <Route path='/' element={<Layout/>}>
    <Route path='/' element={<Home/>}></Route>
    <Route path='Schemes' element={<Schemes/>}></Route>  
    </Route>
   </Routes>
   </BrowserRouter>

    </>
  );
}

export default App;

