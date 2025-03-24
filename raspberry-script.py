#!/usr/bin/env python
from ina219 import INA219
from ina219 import DeviceRangeError
import requests
import time

SHUNT_OHMS = 0.1
API_URL = 'https://meu-projeto.vercel.app/api/tensao'  # Substitua pela URL da sua API

def read():
    ina = INA219(SHUNT_OHMS, busnum=1)
    ina.configure()

    while True:
        # Ler os dados do sensor
        tensao = ina.voltage()
        corrente = ina.current()
        potencia = ina.power()
        tensao_shunt = ina.shunt_voltage()

        # Exibir os dados no terminal
        print(f"Tensão: {tensao:.3f} V")
        print(f"Corrente: {corrente:.3f} mA")
        print(f"Potência: {potencia:.3f} mW")
        print(f"Tensão do Shunt: {tensao_shunt:.3f} mV")
        print("-----------------------------")

        # Enviar os dados para a API
        try:
            response = requests.post(API_URL, json={
                "tensao": tensao,
                "corrente": corrente,
                "potencia": potencia,
                "tensao_shunt": tensao_shunt
            })
            print(f"Dados enviados | Status: {response.status_code}")
        except Exception as e:
            print(f"Erro ao enviar dados: {e}")

        # Esperar 1 segundo antes da próxima leitura
        time.sleep(1)

if __name__ == "__main__":
    read()