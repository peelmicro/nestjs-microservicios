// Esperar a que MongoDB esté listo
sleep(10000);

// Inicializar el conjunto de réplicas
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb:27017" }
  ]
});

// Esperar a que el conjunto de réplicas esté listo
while (true) {
  const status = rs.status();
  if (status.ok === 1 && status.members[0].stateStr === 'PRIMARY') {
    break;
  }
  sleep(1000);
}

print("Replica set inicializado y listo"); 