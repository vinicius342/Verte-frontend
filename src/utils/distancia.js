const RAIO_TERRA_METROS = 6371000;

function paraNumero(valor) {
  if (valor === "" || valor == null) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

const ROTULOS_PRECISAO = {
  endereco: "endereço",
  bairro: "bairro",
  cep: "CEP",
};

function obterCoordenadaReal(cliente) {
  if (!cliente) return null;

  let latitude = paraNumero(cliente.latitude);
  let longitude = paraNumero(cliente.longitude);

  if (latitude == null || longitude == null) {
    latitude = paraNumero(cliente.coordenada?.lat);
    longitude = paraNumero(cliente.coordenada?.lng);
  }

  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
}

export function obterPonto(cliente) {
  const real = obterCoordenadaReal(cliente);
  if (real) return { ...real, estimada: false };

  const geolocalizacao = cliente?.geolocalizacao;
  if (!geolocalizacao) return null;

  const latitude = paraNumero(geolocalizacao.latitude ?? geolocalizacao.lat);
  const longitude = paraNumero(geolocalizacao.longitude ?? geolocalizacao.lng);
  if (latitude == null || longitude == null) return null;

  return {
    latitude,
    longitude,
    estimada: true,
    precisao: geolocalizacao.precisao ?? null,
  };
}

export function textoLocalizacaoAproximada(cliente) {
  const ponto = obterPonto(cliente);
  if (!ponto?.estimada) return null;
  const rotulo = ROTULOS_PRECISAO[ponto.precisao] ?? "endereço";
  return `Localização aproximada pelo ${rotulo}. Capture o GPS para maior precisão.`;
}

export function obterCoordenadasCliente(cliente) {
  const ponto = obterPonto(cliente);
  if (!ponto) return null;
  return { latitude: ponto.latitude, longitude: ponto.longitude };
}

export function haversineMetros(a, b) {
  const paraRadianos = (graus) => (graus * Math.PI) / 180;
  const lat1 = paraRadianos(a.latitude);
  const lat2 = paraRadianos(b.latitude);
  const deltaLat = paraRadianos(b.latitude - a.latitude);
  const deltaLng = paraRadianos(b.longitude - a.longitude);

  const h =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * RAIO_TERRA_METROS * Math.asin(Math.sqrt(h));
}

export function ordenarPorProximidade(origem, clientes) {
  const lista = clientes ?? [];
  const comPonto = [];
  const semPonto = [];

  lista.forEach((cliente) => {
    const ponto = obterPonto(cliente);
    if (ponto) {
      comPonto.push({ cliente, ponto });
    } else {
      semPonto.push(cliente);
    }
  });

  const estimados = comPonto.filter((item) => item.ponto.estimada).length;

  if (!origem) {
    return {
      ordenados: [...comPonto.map((item) => item.cliente), ...semPonto],
      semLocalizacao: semPonto.length,
      estimados,
    };
  }

  const ordenados = [];
  let posicaoAtual = origem;
  const restantes = [...comPonto];

  while (restantes.length > 0) {
    let indiceMaisProximo = 0;
    let menorDistancia = Infinity;

    restantes.forEach((item, indice) => {
      const distancia = haversineMetros(posicaoAtual, item.ponto);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        indiceMaisProximo = indice;
      }
    });

    const [maisProximo] = restantes.splice(indiceMaisProximo, 1);
    ordenados.push(maisProximo.cliente);
    posicaoAtual = maisProximo.ponto;
  }

  return {
    ordenados: [...ordenados, ...semPonto],
    semLocalizacao: semPonto.length,
    estimados,
  };
}

export function formatarDistancia(metros) {
  if (metros < 1000) {
    return `${Math.round(metros / 10) * 10} m`;
  }

  return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}

export function obterPosicao() {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (posicao) =>
          resolve({
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
    } catch {
      resolve(null);
    }
  });
}
