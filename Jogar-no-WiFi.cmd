@echo off
cd /d "%~dp0"
echo Mantenha esta janela aberta enquanto joga no celular.
echo No celular, abra http://IP-DESTE-PC:8080 na mesma rede Wi-Fi.
echo Para descobrir o IP deste PC, consulte Configuracoes de Rede do Windows.
node server.cjs --lan
pause
