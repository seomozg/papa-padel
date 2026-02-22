import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { api, Court } from "@/lib/api";
import YandexMap from "@/components/YandexMap";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const CITY_COORDINATES: Record<string, [number, number]> = {
  'Москва': [55.751244, 37.618423],
  'Санкт-Петербург': [59.934280, 30.335099],
  'Казань': [55.796391, 49.108891],
  'Екатеринбург': [56.838011, 60.597474],
  'Новосибирск': [55.008353, 82.935733],
  'Краснодар': [45.035470, 38.975313],
  'Сочи': [43.585472, 39.723098],
  'Ростов-на-Дону': [47.235714, 39.701505],
};

export default function MapPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.751244, 37.618423]);
  const [mapZoom, setMapZoom] = useState(6);

  useEffect(() => {
    const loadCourts = async () => {
      try {
        setLoading(true);
        const data = await api.getCourts();
        setCourts(data);
      } catch (error) {
        console.error("Failed to load courts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCourts();
  }, []);

  const handleCitySelect = (city: string) => {
    const newSelectedCity = selectedCity === city ? null : city;
    setSelectedCity(newSelectedCity);

    if (newSelectedCity && CITY_COORDINATES[newSelectedCity]) {
      setMapCenter(CITY_COORDINATES[newSelectedCity]);
      setMapZoom(12); // Увеличиваем зум при выборе города
    } else {
      setMapCenter([55.751244, 37.618423]); // Возвращаемся к центру России
      setMapZoom(6);
    }
  };

  const cityCourts = selectedCity ? courts.filter((c) => c.city === selectedCity) : [];
  const cities = [...new Set(courts.map((c) => c.city))];

  const courtsPerCity = cities.reduce((acc, city) => {
    acc[city] = courts.filter((c) => c.city === city).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-display font-bold text-3xl mb-2">Карта кортов</h1>
          <p className="text-muted-foreground mb-8">Интерактивная карта всех падел-клубов России</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <YandexMap courts={courts} center={mapCenter} zoom={mapZoom} />
              </div>

              {/* City list buttons below map */}
              <div className="flex flex-wrap gap-2 mt-4">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedCity === city
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <MapPin size={12} />
                    {city}
                    <span className="bg-background/30 text-xs px-1 rounded">{courtsPerCity[city]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar: courts list */}
            <div className="space-y-4">
              <div className="p-4 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-1">
                  {selectedCity ? `Корты в ${selectedCity}` : "Все корты"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedCity ? `${cityCourts.length} ${cityCourts.length === 1 ? "корт" : "корта"}` : `${courts.length} кортов по всей России`}
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(selectedCity ? cityCourts : courts).map((court) => (
                  <Link
                    key={court.id}
                    to={`/courts/${court.slug}`}
                    className="block p-4 bg-card rounded-xl border border-border hover:border-primary transition-all group"
                  >
                    <div className="flex gap-3">
                      <img src={court.image} alt={court.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{court.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{court.city}, {court.address}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs font-bold text-primary">
                            {court.type === 'indoor' ? 'Крытый' : court.type === 'outdoor' ? 'Открытый' : 'Смешанный'}
                          </span>
                          <span className="text-xs text-muted-foreground">★ {court.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {selectedCity && (
                <Link
                  to={`/courts?city=${selectedCity}`}
                  className="block text-center bg-primary text-primary-foreground px-4 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Все корты в {selectedCity}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
