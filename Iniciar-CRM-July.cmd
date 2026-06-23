@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=C:\github\CRM-July-Utensilios"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\my-app"
set "VENV=%BACKEND%\.venv"
set "REQ=%BACKEND%\requirements.txt"
set "PYTHON_EXE="
set "PYTHON_ARGS="
set "TRY_INSTALL_PYTHON="

echo ==========================================
echo   Iniciando ambiente CRM July Utensilios
echo ==========================================
echo.

where git >nul 2>&1
if not errorlevel 1 (
  echo Verificando atualizacoes do repositorio...
  git -C "%ROOT%" rev-parse --is-inside-work-tree >nul 2>&1
  if not errorlevel 1 (
    set "HAS_LOCAL_CHANGES="
    for /f "usebackq delims=" %%G in (`git -C "%ROOT%" status --porcelain`) do set "HAS_LOCAL_CHANGES=1"
    if defined HAS_LOCAL_CHANGES (
      echo Repositorio com alteracoes locais. Pulando git pull para evitar conflitos.
    ) else (
      git -C "%ROOT%" pull --ff-only
      if errorlevel 1 (
        echo Nao foi possivel executar git pull. Continuando com os arquivos atuais.
      )
    )
  )
)

if exist "%VENV%\Scripts\python.exe" (
  set "PYTHON_EXE=%VENV%\Scripts\python.exe"
) else (
  py -3 -V >nul 2>&1
  if not errorlevel 1 (
    set "PYTHON_EXE=py"
    set "PYTHON_ARGS=-3"
  )
)

if not defined PYTHON_EXE (
  python -V >nul 2>&1
  if not errorlevel 1 set "PYTHON_EXE=python"
)

if not defined PYTHON_EXE (
  python3 -V >nul 2>&1
  if not errorlevel 1 set "PYTHON_EXE=python3"
)

if not defined PYTHON_EXE (
  if exist "C:\Program Files\Python313\python.exe" set "PYTHON_EXE=C:\Program Files\Python313\python.exe"
)

if not defined PYTHON_EXE (
  if exist "C:\Program Files\Python312\python.exe" set "PYTHON_EXE=C:\Program Files\Python312\python.exe"
)

if not defined PYTHON_EXE (
  if exist "C:\Program Files\Python311\python.exe" set "PYTHON_EXE=C:\Program Files\Python311\python.exe"
)

if not defined PYTHON_EXE (
  if exist "%LocalAppData%\Programs\Python\Python313\python.exe" set "PYTHON_EXE=%LocalAppData%\Programs\Python\Python313\python.exe"
)

if not defined PYTHON_EXE (
  if exist "%LocalAppData%\Programs\Python\Python312\python.exe" set "PYTHON_EXE=%LocalAppData%\Programs\Python\Python312\python.exe"
)

if not defined PYTHON_EXE (
  if exist "%LocalAppData%\Programs\Python\Python311\python.exe" set "PYTHON_EXE=%LocalAppData%\Programs\Python\Python311\python.exe"
)

if not defined PYTHON_EXE (
  where winget >nul 2>&1
  if not errorlevel 1 (
    set /p TRY_INSTALL_PYTHON=Python nao encontrado. Deseja tentar instalar via winget agora? ^(S/N^): 
    if /I "%TRY_INSTALL_PYTHON%"=="S" (
      winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
      if errorlevel 1 (
        echo Falha ao instalar Python via winget.
      ) else (
        echo Python instalado. Execute este script novamente.
      )
      pause
      exit /b 1
    )
  )
  echo Python funcional nao foi encontrado.
  echo.
  echo O Windows esta mostrando apenas o atalho da Microsoft Store.
  echo Instale o Python por: https://www.python.org/downloads/windows/
  echo.
  echo Durante a instalacao, marque a opcao "Add python.exe to PATH".
  start "" "https://www.python.org/downloads/windows/"
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo NPM nao encontrado.
  echo Instale o Node.js e tente novamente.
  pause
  exit /b 1
)

if not exist "%VENV%\Scripts\python.exe" (
  echo Criando a virtualenv do backend...
  if /I "%PYTHON_EXE%"=="py" (
    call py %PYTHON_ARGS% -m venv "%VENV%"
  ) else (
    call "%PYTHON_EXE%" -m venv "%VENV%"
  )
  if errorlevel 1 (
    echo Falha ao criar a virtualenv.
    pause
    exit /b 1
  )
)

echo Atualizando dependencias do backend...
call "%VENV%\Scripts\activate.bat"
python -m pip install --upgrade pip
if errorlevel 1 (
  echo Falha ao atualizar o pip.
  pause
  exit /b 1
)

pip install -r "%REQ%"
if errorlevel 1 (
  echo Falha ao instalar as dependencias do backend.
  pause
  exit /b 1
)

echo Atualizando dependencias do frontend...
pushd "%FRONTEND%"
call npm install
if errorlevel 1 (
  popd
  echo Falha ao instalar as dependencias do frontend.
  pause
  exit /b 1
)
popd

echo Abrindo backend...
start "CRM Backend" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location '%BACKEND%'; & '%BACKEND%\.venv\Scripts\Activate.ps1'; python manage.py runserver"

echo Abrindo frontend...
start "CRM Frontend" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location '%FRONTEND%'; npm run dev"

echo Aguardando frontend iniciar...
timeout /t 6 /nobreak >nul

echo Abrindo http://localhost:3000 ...
start "" "http://localhost:3000"

echo.
echo Backend, frontend e navegador iniciados.
exit /b 0
