import SVG from 'svg.js';
import Color from 'color';
import fetch from 'node-fetch';
import dat from 'dat-gui';
import Library from './lib';
import { CONFIG } from './config';


/**
 * README
 *
 * please be aware of:
 * - enable CORS in browser to allow requests on localhost
 * - number of api calls per day are limited (if maximum number of calls is reached, you can just display demo data)
 */

class Artwork {
  constructor() {
    this.artworkWidth = 0;
    this.artworkHeight = 0;
    this.demoMap = {};
    this.tempMap = [];

    this.location = 'xx.yyyyyy,xx.yyyyyy';
    this.date = 'YYYY-MM-DD';
    this.demoData = 'data2';

    this.changeOffsetY = 120;
    this.changeStepY = 25;
    this.changeScale = 1;
  }

  init() {
    this.initConfig();
    this.initDemoData();
    this.initGui();
    this.prepareArtwork();
    this.generateArtwork();
  }

  initDemoData() {
    this.demoMap = {
      "Munich_spring": "data3",
      "Munich_summer": "data1",
      "Munich_autumn": "data4",
      "Munich_winter": "data2",
      "Uluru_summer": "data5",
      "Uluru_winter": "data9",
      "Sydney_winter": "data7",
      "Sydney_summer": "data8",
      "Sahara_winter": "data6",
      "Antarktika_winter": "data0",
      "Lauffen_birthday": "data10",
    };
  }

  initConfig() {
    this.tempMap = [
      {
        temp: 40,
        color: CONFIG.colors.tempHot,
        mix: CONFIG.colors.tempHot,
      },
      {
        temp: 20,
        color: CONFIG.colors.tempHot,
        mix: CONFIG.colors.tempWarm,
      },
      {
        temp: 9,
        color: CONFIG.colors.tempWarm,
        mix: CONFIG.colors.tempOk,
      },
      {
        temp: 0,
        color: CONFIG.colors.tempOk,
        mix: CONFIG.colors.tempFresh,
      },
      {
        temp: -10,
        color: CONFIG.colors.tempFresh,
        mix: CONFIG.colors.tempCold
      },
    ];
  }

  initGui() {
    const gui = new dat.GUI();
    const controller = gui.add(this, 'demoData', this.demoMap );
    gui.add(this, 'location');
    // gui.add(this, 'date');

    const mod = gui.addFolder('Manipulate');
    mod.add(this, 'changeOffsetY').min(0).max(150).step(10);
    mod.add(this, 'changeStepY').min(0).max(50).step(10);
    mod.add(this, 'changeScale').min(1).max(2).step(0.2);

    gui.add(this, 'render');

    controller.onChange(() => {
      this.generateArtwork();
    });
  }

  prepareArtwork() {
    // get dimension of original svg
    this.artworkWrapper = document.querySelector('#artwork-wrapper');
    this.artworkWidth = this.artworkWrapper.clientWidth;
    this.artworkHeight = this.artworkWrapper.clientHeight;
  }

  reInitArtwork() {
    // throw away initial svg
    const svgInitial = this.artworkWrapper.querySelector('svg');
    this.artworkWrapper.removeChild(svgInitial);
  }

  render() {
    // render based on gui input
    const apiUrl = Library.getApiUrl(this.location, this.date, this.demoData);
    this.generateArtwork(apiUrl);
  }

  generateArtwork(apiUrl = null) {
    if (!SVG.supported) {
      alert('SVG is not supported');
      return false;
    }

    const useApiUrl = apiUrl || Library.getApiUrlLocal(this.demoData);
    const reqOptions = {
      method: 'GET',
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      mode: 'cors',
      cache: 'default'
    };

    fetch(useApiUrl, reqOptions).then((...response) => {
      this.handleResponse(...response);

    }).catch(() => {
      console.error('use data from fallback request');
      this.triggerRequestFallback();
    });
  }

  triggerRequestFallback() {
    fetch(CONFIG.api.url.local).then((...response) => {
      this.handleResponse(...response);
    }).catch(() => {
      console.error('no data');
    });
  }

  handleResponse(response) {
    if (response.ok) {
      response.json().then((...jsonData) => {
        this.drawArt(...jsonData);
      });
    }
  }


  drawArt(data) {
    this.reInitArtwork();

    // init my svg
    this.draw = SVG('artwork-wrapper').size(this.artworkWidth, this.artworkHeight);

    // presets
    const startY = this.artworkHeight/2;
    const stepX = this.artworkWidth/12;

    // INFLUENCED BY GUI
    const offsetY = this.changeOffsetY;
    const stepSun = this.changeStepY * -1;

    let posX = 0;
    let posY = 0;
    let stepper = 0.5;


    /**
     * PREPARE DATA SOURCE
     */
    // extract daily data from complete dataset
    const dataDaily = data.daily.data[0];

    // reduce base data from 48 hours to 24 hours
    const daily = data.hourly.data.splice(0, 24);

    /**
     * PARAMS FROM DATA SOURCE TO MANIPULATE RENDERING
     */
    // DATA: use time of sunrise and sunset to align elements (y-axis)
    const paramTimeSunrise = Library.getHour(dataDaily.sunriseTime);
    const paramTimeSunset = Library.getHour(dataDaily.sunsetTime);

    // DATA: use average temperature of day to calculate size factor of elements
    const paramAverageTemp = (Math.abs(dataDaily.temperatureMin) + Math.abs(dataDaily.temperatureMax)) / 2;

    /**
     * PREPARATION OF INITIAL DISPLAY VALUES
     */
    let timeSunReference = paramTimeSunrise;
    let baseY = startY - offsetY;
    const factorSize = (this.artworkHeight/2 / paramAverageTemp) - 3;


    daily.forEach((dataHour, index) => {
      /**
       * PARAMS FROM DATA SOURCE TO MANIPULATE RENDERING
       */
      // DATA: use temperature as base value to set size of elements
      // INFLUENCED BY GUI
      let paramSize = Math.abs(dataHour.temperature) * factorSize * this.changeScale;
      paramSize = Math.ceil(paramSize);

      // DATA: use windBearing to rotate triangles
      const paramRotate = dataHour.windBearing;

      // DATA: use cloudCover as parameter to change opacity of fill color
      let paramOpaque = 1 - dataHour.cloudCover + 0.1;
      paramOpaque = (paramOpaque >= 0.75) ? 0.6 : paramOpaque;

      // DATA: use temperature as parameter to calculate color
      const paramColorTemp = this.generateColor(dataHour.temperature);


      // reset values
      if (index === 0) {
        stepper = 0.5;
      } else if (index === 12) {
        stepper = 0.5;
        baseY = startY + offsetY;

        // DATA: use time of sunset for second row
        timeSunReference = paramTimeSunset;
      }

      // calculate position of elements
      posX = (stepX * stepper);

      if (index >= 12) {
        posY = baseY + (Math.cos(index - timeSunReference) * stepSun);
      } else {
        posY = baseY + (Math.sin(index - timeSunReference) * stepSun);
      }


      const colorCircle1 = paramColorTemp.negate().rotate(90).fade(0.5).mix(paramColorTemp.negate().rotate(180), 0.6).string();
      this.generateCircle(posX, posY, paramSize * 1.2, 'transparent', 1, colorCircle1, 0.3, 1, index + 1);

      const colorCircle2 = paramColorTemp.string();
      this.generateCircle(posX, posY, paramSize * 0.6, colorCircle2, 0.2, 'transparent', 0.3, 0, index + 1);


      // calculate render position of triangle
      const x = posX - (paramSize/2);
      const y = posY - (paramSize/2) * 1.4;

      const colorTriangle = paramColorTemp.string();
      this.generateTriangle(x, y, paramSize, colorTriangle, paramOpaque, paramColorTemp.string(), 1, 1, 1, paramRotate);

      const colorLine1 = paramColorTemp.rotate(-40).string();
      this.generateTriangle(x, y, paramSize, 'transparent', 1, colorLine1, 0.4, 1, 1.1, paramRotate);

      const colorLine2 = paramColorTemp.rotate(-20).string();
      this.generateTriangle(x, y, paramSize, 'transparent', 1, colorLine2, 0.4, 0.5, 1.2, paramRotate);

      stepper += 1;
    });
  }

  generateTriangle(x, y, size, fillColor, fillOpacity, strokeColor, strokeOpacity, strokeWidth, scale = 1, rotate) {
    this.draw.polygon(`${x},${y + size} ${x + size/2},${y - Math.sin(60) * size/2} ${x + size},${y + size}`).attr({
      fill: fillColor,
      'fill-opacity': fillOpacity,
      stroke: strokeColor,
      'stroke-opacity': strokeOpacity,
      'stroke-width': strokeWidth,
    }).scale(scale).rotate(rotate);
  }

  generateCircle(x, y, size, fillColor, fillOpacity, strokeColor, strokeOpacity, strokeWidth, nr) {
    this.draw.circle(size).attr({
      cx: x,
      cy: y,
      fill: fillColor,
      'fill-opacity': fillOpacity,
      stroke: strokeColor,
      'stroke-opacity': strokeOpacity,
      'stroke-width': strokeWidth,
      'nr': nr
    });
  }

  generateColor(temperature) {
    let lastTemp = this.tempMap[0].temp;
    let color = Color(this.tempMap[this.tempMap.length - 1].color);

    this.tempMap.some((value) => {
      if (temperature > value.temp) {
        let diff = 1;
        if (temperature <= lastTemp) {
          diff = (((lastTemp - temperature) / (lastTemp - value.temp))) - 0.1;
        }

        color = Color(value.color).mix(Color(value.mix), diff);
        return true;
      }

      lastTemp = value.temp;
    });

    return color;
  }
}

export default Artwork;
