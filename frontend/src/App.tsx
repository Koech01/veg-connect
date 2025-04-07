import './App.css';
import Login from './components/Login';
import Signup from './components/SignUp';
import NotFound from './components/NotFound';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import ResetPassword from './components/ResetPassword';
import ForgotPassword from './components/ForgotPassword';
import { BrowserRouter, Routes, Route } from 'react-router-dom'


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Dashboard/>}/>
          <Route path='*' element={<NotFound/>}/>
          <Route path='/login/' element={<Login/>}/>
          <Route path='/signup/' element={<Signup/>}/>
          <Route path='/forgot/' element={<ForgotPassword/>}/>
          <Route path='/welcome/' element={<Onboarding/>}/>
          <Route path='/reset/:token/' element={<ResetPassword/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;