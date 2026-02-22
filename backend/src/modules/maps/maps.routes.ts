import express from 'express';
import axios from 'axios';

const router = express.Router();

// GET /maps/directions - получение маршрута между двумя точками
router.get('/directions', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: 'Missing required parameters: from and to'
      });
    }

    // Validate coordinates format (lat,lng)
    const fromCoords = from.toString().split(',');
    const toCoords = to.toString().split(',');

    if (fromCoords.length !== 2 || toCoords.length !== 2) {
      return res.status(400).json({
        message: 'Invalid coordinates format. Use: lat,lng'
      });
    }

    const fromLat = parseFloat(fromCoords[0]);
    const fromLng = parseFloat(fromCoords[1]);
    const toLat = parseFloat(toCoords[0]);
    const toLng = parseFloat(toCoords[1]);

    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      return res.status(400).json({
        message: 'Invalid coordinates format'
      });
    }

    // In production, use Yandex Maps API
    // For now, return mock data
    const mockResponse = {
      routes: [
        {
          distance: {
            value: 650000, // meters
            text: '650 km'
          },
          duration: {
            value: 25200, // seconds
            text: '7 hours'
          },
          steps: [
            {
              instruction: 'Head north on ул. Тверская toward пл. Пушкина',
              distance: { value: 500, text: '500 m' },
              duration: { value: 120, text: '2 min' }
            },
            {
              instruction: 'Turn right onto ул. Моховая',
              distance: { value: 300, text: '300 m' },
              duration: { value: 90, text: '1.5 min' }
            }
            // More steps would be here
          ],
          polyline: 'mock_polyline_data'
        }
      ]
    };

    // Uncomment for real Yandex Maps API integration
    /*
    const YANDEX_API_KEY = process.env.YANDEX_MAPS_API_KEY;
    const response = await axios.get(
      `https://api.routing.yandex.net/v2/route`,
      {
        params: {
          apikey: YANDEX_API_KEY,
          waypoints: `${fromLng},${fromLat};${toLng},${toLat}`,
          mode: 'driving'
        }
      }
    );

    res.json(response.data);
    */

    res.json(mockResponse);
  } catch (error) {
    console.error('Maps API error:', error);
    res.status(500).json({ message: 'Failed to get directions' });
  }
});

export { router as mapsRouter };