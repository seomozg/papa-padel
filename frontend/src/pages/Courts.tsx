import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, MapPin, X, Loader2 } from "lucide-react";
import { api, Court } from "@/lib/api";
import CourtCard from "@/components/CourtCard";
import Footer from "@/components/Footer";

const TYPES = [
  { value: "", label: "Все типы" },
  { value: "indoor", label: "Крытые" },
  { value: "outdoor", label: "Открытые" },
  { value: "mixed", label: "Смешанные" },
];

const SORT_OPTIONS = [
  { value: "rating", label: "По рейтингу" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "reviews", label: "По отзывам" },
];

export default function Courts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [allCourts, setAllCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);

  // Load all courts once for cities list
  useEffect(() => {
    const loadAllCourts = async () => {
      try {
        const data = await api.getCourts({});
        setAllCourts(data);
      } catch (err) {
        console.error('Failed to load courts for cities:', err);
      }
    };
    loadAllCourts();
  }, []);

  // Get unique cities from courts
  const cities = [...new Set(allCourts.map(c => c.city))].sort();
  const citiesWithCount = cities.map(cityName => ({
    name: cityName,
    count: allCourts.filter(c => c.city === cityName).length
  }));

  const loadCourts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        city: city || undefined,
        type: type || undefined,
        sort: sort || undefined,
        search: search || undefined,
      };
      const data = await api.getCourts(params);
      setCourts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourts();
  }, [city, type, sort, search]);

  const hasFilters = city !== "" || type !== "" || search !== "";

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <h1 className="font-display font-bold text-3xl mb-2">Каталог кортов</h1>
            <p className="text-muted-foreground">
              {loading ? 'Загрузка...' : `Найдено ${courts.length} кортов по всей России`}
            </p>

            {/* Search bar */}
            <div className="mt-6 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Поиск по названию, городу или адресу..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  showFilters || hasFilters
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Фильтры</span>
                {hasFilters && <span className="w-2 h-2 bg-primary-foreground rounded-full" />}
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-muted/50 rounded-xl flex flex-wrap gap-4 animate-fade-up">
                {/* City */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Город</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-w-[160px] rounded-lg [&>option]:bg-background [&>option]:text-foreground [&>option]:rounded-lg"
                  >
                    <option value="">Все города</option>
                    {citiesWithCount.map((c) => (
                      <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Тип корта</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-w-[160px] rounded-lg [&>option]:bg-background [&>option]:text-foreground [&>option]:rounded-lg"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Сортировка</label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-w-[160px] rounded-lg [&>option]:bg-background [&>option]:text-foreground [&>option]:rounded-lg"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {hasFilters && (
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={() => { setCity(""); setType(""); setSearch(""); }}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors px-3 py-2"
                    >
                      <X size={14} /> Сбросить
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* City chips */}
          <div className="container mx-auto px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setCity("")}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  city === ""
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                Все города
              </button>
              {citiesWithCount.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setCity(c.name)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    city === c.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <MapPin size={12} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">❌</p>
              <h3 className="font-display font-bold text-xl mb-2">Ошибка загрузки</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : courts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🎾</p>
              <h3 className="font-display font-bold text-xl mb-2">Ничего не найдено</h3>
              <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courts.map((court, i) => (
                  <div key={court.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                    <CourtCard court={court} />
                  </div>
                ))}
              </div>

              {/* Load more button if needed */}
              {courts.length >= 9 && (
                <div className="text-center mt-10">
                  <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
                    Загрузить еще
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}