import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [coinList, setCoinList] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin'); // Set initial selectedCoin to 'bitcoin'
  const [coinData, setCoinData] = useState({ prices: [], volumes: [] });
  const [error, setError] = useState('');
  const [indicatorColor, setIndicatorColor] = useState('red'); // Default indicator color

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/list');
        setCoinList(response.data);
      } catch (err) {
        console.error('Error fetching coin list:', err);
        setError('Error fetching coin list. Please refresh the page.');
      }
    };
    fetchCoins();
  }, []);

  useEffect(() => {
    if (selectedCoin) {
      const fetchData = async () => {
        try {
          const url = `https://api.coingecko.com/api/v3/coins/${selectedCoin}/market_chart?vs_currency=usd&days=365`;
          const response = await axios.get(url);
          setCoinData({
            prices: response.data.prices,
            volumes: response.data.total_volumes,
          });
          updateIndicator(response.data.total_volumes);
          setError('');
        } catch (err) {
          setError('Failed to fetch data. Please try again later.');
          console.error(err);
        }
      };
      fetchData();
    }
  }, [selectedCoin]);

  const updateIndicator = (volumes) => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day
    const maxVolume = Math.max(...volumes.map(d => d[1]));
    const threshold = 0.1 * maxVolume;
    let lastGreenDate = null;

    volumes.forEach(volume => {
      if (volume[1] < threshold) {
        lastGreenDate = new Date(volume[0]);
      }
    });

    if (lastGreenDate) {
      const daysSinceLastGreen = Math.round((now - lastGreenDate) / oneDay);
      if (daysSinceLastGreen <= 10) {
        setIndicatorColor('green');
      } else if (daysSinceLastGreen <= 30) {
        setIndicatorColor('yellow');
      } else {
        setIndicatorColor('red');
      }
    } else {
      setIndicatorColor('red'); // Default to red if no green volumes are found
    }
  };

  const handleSelectCoin = (coinId) => {
    setSelectedCoin(coinId);
    setSearchTerm('');
  };

  const commonChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Cryptocurrency Data',
      },
    },
  };

  const volumeChartOptions = {
    ...commonChartOptions,
    scales: {
      y: {
        ticks: {
          callback: function(value, index, ticks) {
            return value / 1e6 + 'M'; // Convert the value to millions
          }
        }
      }
    }
  };

  const createChartData = (data, label) => {
    const maxVolume = Math.max(...data.map(d => d[1]));
    const threshold = 0.1 * maxVolume;

    return {
      labels: data.map(d => new Date(d[0]).toLocaleDateString()),
      datasets: [
        {
          label: label,
          data: data.map(d => d[1]),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: data.map(d => d[1] < threshold ? 'green' : 'rgba(75, 192, 192, 0.5)'),
        },
      ],
    };
  };

  return (
    <div className="app">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search for a coin..."
      />
      {searchTerm && (
        <ul className="coin-suggestions">
          {coinList.filter(coin => coin.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5).map(coin => (
            <li key={coin.id} onClick={() => handleSelectCoin(coin.id)}>
              {coin.name} ({coin.symbol.toUpperCase()})
            </li>
          ))}
        </ul>
      )}
      {error && <p className="error">{error}</p>}
      {selectedCoin && (
        <>
          <h2>Price Chart</h2>
          <Line options={commonChartOptions} data={createChartData(coinData.prices, 'Price')} />
          <h2>Volume Chart and Safety Indicator</h2>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Bar options={volumeChartOptions} data={createChartData(coinData.volumes, 'Volume')} />
            <div className="traffic-signal">
              <div className={`signal-light ${indicatorColor === 'red' ? 'red' : ''}`}></div>
              <div className={`signal-light ${indicatorColor === 'yellow' ? 'yellow' : ''}`}></div>
              <div className={`signal-light ${indicatorColor === 'green' ? 'green' : ''}`}></div>
            </div>
          </div>
        </>
      )}
      <style>{`
        .app {
          max-width: 600px;
          margin: auto;
          padding: 20px;
        }
        .coin-suggestions {
          list-style: none;
          padding: 0;
          margin-top: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .coin-suggestions li {
          padding: 8px;
          cursor: pointer;
          background-color: #f9f9f9;
        }
        .coin-suggestions li:hover {
          background-color: #efefef;
        }
        .error {
          color: red;
        }
        .traffic-signal {
          width: 60px;
          height: 180px; /* Adjusted to match the height of the volume graph */
          background-color: black;
          border: 2px solid black;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
          padding: 10px;
          margin-left: 20px;
        }
        .signal-light {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: #555; /* Default color for inactive lights */
        }
        .signal-light.red {
          background-color: red;
        }
        .signal-light.yellow {
          background-color: yellow;
        }
        .signal-light.green {
          background-color: green;
        }
      `}</style>
    </div>
  );
};

export default App;