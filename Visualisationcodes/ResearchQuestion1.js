import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [coinList, setCoinList] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin'); // Default selected coin
  const [coinData, setCoinData] = useState({ prices: [] });
  const [error, setError] = useState('');

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
          });
          setError('');
        } catch (err) {
          setError('Failed to fetch data. Please try again later.');
          console.error(err);
        }
      };
      fetchData();
    }
  }, [selectedCoin]);

  const handleSelectCoin = (coinId) => {
    setSelectedCoin(coinId);
    setSearchTerm('');
  };

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Cryptocurrency Price Chart',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Price (USD)'
        }
      }
    }
  };

  const createChartData = (data, label) => {
    return {
      labels: data.map(d => new Date(d[0]).toLocaleDateString()),
      datasets: [
        {
          label: label,
          data: data.map(d => d[1]),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    };
  };

  return (
    <div className="app" style={{ width: '800px', height: '400px' }}>
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
          <div style={{ width: '100%', height: '100%' }}>
            <Line options={commonChartOptions} data={createChartData(coinData.prices, 'Price')} />
          </div>
        </>
      )}
    </div>
  );
};

export default App;