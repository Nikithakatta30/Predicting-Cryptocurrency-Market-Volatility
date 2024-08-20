import React, { useState, useEffect, useCallback } from 'react';
import { Bubble } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';

// Register the necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

// Define colors object outside the fetchData function to make it globally accessible within the component
const colors = {
  'Ethereum': 'rgba(255, 99, 132, 0.6)',
  'Solana': 'rgba(54, 162, 235, 0.6)',
  'Polygon': 'rgba(255, 206, 86, 0.6)',
  'Meme': 'rgba(75, 192, 192, 0.6)',
  'AI': 'rgba(153, 102, 255, 0.6)',
  'Other': 'rgba(255, 159, 64, 0.6)'
};

const App = () => {
  const [chartData, setChartData] = useState({
    datasets: []
  });
  const [marketCaps, setMarketCaps] = useState({});
  const [loading, setLoading] = useState(true);

  const categorizeCoin = (coin) => {
    const name = coin.name.toLowerCase();
    const symbol = coin.symbol.toLowerCase();

    if (name.includes('ethereum') || symbol.includes('eth')) {
      return 'Ethereum';
    } else if (name.includes('solana') || symbol.includes('sol')) {
      return 'Solana';
    } else if (name.includes('polygon') || symbol.includes('matic')) {
      return 'Polygon';
    } else if (name.includes('doge') || symbol.includes('doge')) {
      return 'Meme';
    } else if (name.includes('ai')) {
      return 'AI';
    } else {
      return 'Other';
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false
        }
      });

      const data = response.data;
      const bubbleData = [];
      const localMarketCaps = {};

      data.forEach(coin => {
        const ecosystem = categorizeCoin(coin);
        const color = colors[ecosystem];
        const marketCap = coin.market_cap;

        if (localMarketCaps[ecosystem]) {
          localMarketCaps[ecosystem] += marketCap;
        } else {
          localMarketCaps[ecosystem] = marketCap;
        }

        bubbleData.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          r: Math.cbrt(marketCap) * 0.01,
          backgroundColor: color,
          label: ecosystem
        });
      });

      setChartData({
        datasets: [{
          label: 'Top 100 Cryptocurrencies by Ecosystem',
          data: bubbleData,
          backgroundColor: bubbleData.map(b => b.backgroundColor)
        }]
      });

      setMarketCaps(localMarketCaps);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data: ', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ width: '80vw', height: '80vh', margin: 'auto' }}>
      <h1>Cryptocurrency Market Ecosystems</h1>
      <Bubble data={chartData} options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.raw.label}: Market Cap`;
              }
            }
          },
          legend: {
            display: false,
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Random X Value'
            },
            ticks: {
              min: 0,
              max: 100
            }
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: 'Random Y Value'
            },
            ticks: {
              min: 0,
              max: 100
            }
          }
        }
      }} />
      <div style={{ marginTop: '20px' }}>
        <p>Legend:</p>
        {Object.keys(colors).map(key => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ width: '20px', height: '20px', backgroundColor: colors[key], marginRight: '10px', display: 'inline-block' }}></span> 
            {key}: ${marketCaps[key] ? marketCaps[key].toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 'N/A'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;