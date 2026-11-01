import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Detection from './pages/Detection';
import Analysis from './pages/Analysis';
import History from './pages/History';
import ModelPerformance from './pages/ModelPerformance';
import About from './pages/About';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [globalAnalysisData, setGlobalAnalysisData] = useState(null);

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home setActivePage={setActivePage} />;
      case 'detection':
        return (
          <Detection
            setActivePage={setActivePage}
            setGlobalAnalysisData={setGlobalAnalysisData}
          />
        );
      case 'analysis':
        return (
          <Analysis
            analysisData={globalAnalysisData}
            setActivePage={setActivePage}
          />
        );
      case 'history':
        return (
          <History
            setActivePage={setActivePage}
            setGlobalAnalysisData={setGlobalAnalysisData}
          />
        );
      case 'performance':
        return <ModelPerformance />;
      case 'about':
        return <About />;
      default:
        return <Home setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E] text-slate-100">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer setActivePage={setActivePage} />
    </div>
  );
}
