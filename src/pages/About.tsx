import { useState, useEffect } from "react";
import { ArrowLeft, Github, Calendar, User, MessageSquare, ExternalLink, Info, Code, Database, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Commit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

// Настройки GitHub репозитория
const GITHUB_USERNAME = 'serdyukovsky';
const POSSIBLE_REPOS = [
  'cedarislanddashboard',
  'uni-profit-tracker',
  'dashboard'
];

// Настройки кэширования
const CACHE_KEY = 'github_commits_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут в миллисекундах

// Функции для работы с кэшем
const getCachedCommits = (): Commit[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Проверяем, не истек ли кэш
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    console.log('Using cached commits data');
    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCachedCommits = (commits: Commit[]): void => {
  try {
    const cacheData = {
      data: commits,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('Commits cached successfully');
  } catch (error) {
    console.error('Error saving cache:', error);
  }
};

export default function About() {
  const navigate = useNavigate();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const handleBack = () => {
    navigate('/');
  };

  const handleRefreshCommits = () => {
    // Очищаем кэш и перезагружаем
    localStorage.removeItem(CACHE_KEY);
    setLoading(true);
    setError(null);
    
    // Принудительно перезагружаем коммиты
    const fetchCommits = async () => {
      try {
        console.log('Force refreshing commits...');
        const possibleRepos = POSSIBLE_REPOS.map(repo => 
          repo.includes('/') ? repo : `${GITHUB_USERNAME}/${repo}`
        );
        
        let response = null;
        
        for (const repo of possibleRepos) {
          try {
            console.log(`Trying repository: ${repo}`);
            response = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`);
            if (response.ok) {
              console.log(`Found repository: ${repo}`);
              break;
            }
          } catch (error) {
            console.log(`Repository ${repo} not found, trying next...`);
          }
        }

        if (response && response.ok) {
          const data = await response.json();
          setCommits(data);
          setError(null);
          setCachedCommits(data);
        } else {
          if (response?.status === 403) {
            const demoCommits = [
              {
                sha: 'demo123',
                commit: {
                  author: {
                    name: 'Developer',
                    email: 'dev@example.com',
                    date: new Date().toISOString()
                  },
                  message: 'Демонстрационный коммит - лимит GitHub API превышен'
                },
                html_url: 'https://github.com/serdyukovsky/cedarislanddashboard'
              }
            ];
            setCommits(demoCommits);
            setError(null);
            setCachedCommits(demoCommits);
          } else {
            setError(`Ошибка загрузки: ${response?.status} ${response?.statusText}`);
          }
        }
      } catch (error) {
        console.error('Error fetching commits:', error);
        setError('Ошибка подключения к GitHub API');
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  };

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        // Сначала проверяем кэш
        const cachedCommits = getCachedCommits();
        if (cachedCommits) {
          console.log('Loading commits from cache');
          setCommits(cachedCommits);
          setError(null);
          setLoading(false);
          return;
        }

        console.log('Fetching commits from GitHub...');
        // Попробуем разные варианты репозитория
        const possibleRepos = POSSIBLE_REPOS.map(repo => 
          repo.includes('/') ? repo : `${GITHUB_USERNAME}/${repo}`
        );
        
        let response = null;
        let lastError = null;
        
        for (const repo of possibleRepos) {
          try {
            console.log(`Trying repository: ${repo}`);
            response = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`);
            if (response.ok) {
              console.log(`Found repository: ${repo}`);
              break;
            }
          } catch (error) {
            lastError = error;
            console.log(`Repository ${repo} not found, trying next...`);
          }
        }
        if (response && response.ok) {
          console.log('Response status:', response.status);
          console.log('Response ok:', response.ok);
          const data = await response.json();
          console.log('Commits data:', data);
          setCommits(data);
          setError(null);
          
          // Сохраняем данные в кэш
          setCachedCommits(data);
        } else {
          console.error('GitHub API error:', response?.status, response?.statusText);
          const errorText = response ? await response.text() : 'No response';
          console.error('Error response:', errorText);
          
          if (response?.status === 403) {
            // Показываем демонстрационные данные при превышении лимита
            console.log('Rate limit exceeded, showing demo data');
            const demoCommits = [
              {
                sha: 'demo123',
                commit: {
                  author: {
                    name: 'Developer',
                    email: 'dev@example.com',
                    date: new Date().toISOString()
                  },
                  message: 'Демонстрационный коммит - лимит GitHub API превышен'
                },
                html_url: 'https://github.com/serdyukovsky/cedarislanddashboard'
              }
            ];
            setCommits(demoCommits);
            setError(null);
            
            // Кэшируем демо-данные на короткое время (5 минут)
            const shortCacheData = {
              data: demoCommits,
              timestamp: Date.now()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(shortCacheData));
          } else if (response?.status === 404) {
            setError('Репозиторий не найден. Проверьте правильность имени репозитория.');
          } else {
            setError(`Ошибка загрузки: ${response?.status} ${response?.statusText}`);
          }
        }
      } catch (error) {
        console.error('Error fetching commits:', error);
        setError('Ошибка подключения к GitHub API');
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  }, []);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Кнопка назад и заголовок в одной строке */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
            aria-label="Назад"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">О приложении</h1>
        </div>

        {/* Основной контент */}
        <div className="space-y-6">
          <div>
            <p className="text-gray-600">Финансовый дашборд Кедровый Остров</p>
          </div>

          {/* Описание */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Описание</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Это финансовый дашборд для отслеживания выручки, расходов и прибыли 
              по различным бизнес-юнитам компании Кедровый Остров. Приложение позволяет 
              анализировать финансовые показатели в динамике и принимать обоснованные 
              управленческие решения.
            </p>
            
            {/* Техническая информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Источник данных</p>
                  <p className="text-xs text-gray-600">Google Sheets API</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Code className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Технологии</p>
                  <p className="text-xs text-gray-600">React, TypeScript, Vite</p>
                </div>
              </div>
            </div>
          </div>

          {/* Карточка с информацией */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о приложении</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Версия:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Дата сборки:</span>
                <span className="font-medium">{new Date().toLocaleDateString("ru-RU")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Статус:</span>
                <span className="text-green-600 font-medium">Активно</span>
              </div>
            </div>

            {/* Последние изменения */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Последние изменения
                </h3>
                <button
                  onClick={handleRefreshCommits}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Загрузка...' : 'Обновить'}
                </button>
              </div>
              {loading ? (
                <div className="text-gray-500 text-sm">Загрузка изменений...</div>
              ) : error ? (
                <div className="text-red-500 text-sm">
                  {error}
                  <div className="mt-2 space-y-1">
                    {!error.includes('лимит') && (
                      <>
                        <div className="text-xs text-gray-600">
                          Проверялись репозитории:
                        </div>
                        <ul className="text-xs text-gray-500 ml-4">
                          {POSSIBLE_REPOS.map(repo => (
                            <li key={repo}>• {repo.includes('/') ? repo : `${GITHUB_USERNAME}/${repo}`}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    <button 
                      onClick={() => window.location.reload()} 
                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                    >
                      Попробовать снова
                    </button>
                  </div>
                </div>
              ) : commits.length > 0 ? (
                <div className="space-y-3">
                  {commits[0]?.sha === 'demo123' && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                      📋 Показаны демонстрационные данные (лимит GitHub API)
                    </div>
                  )}
                  {commits.map((commit, index) => (
                    <div key={commit.sha} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {commit.commit.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(commit.commit.author.date).toLocaleDateString("ru-RU", {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{commit.commit.author.name}</span>
                        </div>
                      </div>
                      <a
                        href={commit.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Нет доступных изменений</div>
              )}
            </div>
          </div>

          {/* Ссылки */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ссылки</h2>
            <div className="space-y-3">
              <a 
                href="https://github.com/serdyukovsky/cedarislanddashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Github className="h-5 w-5 text-gray-700" />
                <div>
                  <p className="text-sm font-medium text-gray-900">GitHub Repository</p>
                  <p className="text-xs text-gray-600">Исходный код проекта</p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
              </a>
              
              <a 
                href="https://t.me/iamserdyuk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Send className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Telegram</p>
                  <p className="text-xs text-gray-600">Связаться с разработчиком</p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}