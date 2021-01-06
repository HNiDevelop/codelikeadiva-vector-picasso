const config = {
  api: {
    key: '6db6191502c834949a22b7eea1c80652',
    url: {
      online: 'https://api.darksky.net/forecast/',
      local: 'http://localhost:8080/api/',
    }
  },
  colors: {
    tempHot: '#d32300',
    tempWarm: '#ffff00',
    tempOk: '#00dde5',
    tempFresh: '#0150af',
    tempCold: '#0150af',
  }
};

export {
  config as CONFIG
};
