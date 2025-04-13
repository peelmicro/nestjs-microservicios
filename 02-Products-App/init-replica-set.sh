#!/bin/bash

# Esperar a que MongoDB esté listo
sleep 10

# Inicializar el conjunto de réplicas
docker exec mongodb mongosh -u root -p example --eval "rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongodb:27017' }
  ]
})"

# Esperar a que el conjunto de réplicas esté listo
sleep 5

# Verificar el estado
docker exec mongodb mongosh -u root -p example --eval "rs.status()" 