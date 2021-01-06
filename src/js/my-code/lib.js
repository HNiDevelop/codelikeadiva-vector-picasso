import { CONFIG } from './config';

class Library {

  /**
   * HANDLE API URL
   */

  static getApiUrl(location = null, date = null, demoFile = 'data0') {
    const loc = location.split(',');

    if (loc.length === 2) {
      if(Library.validateLat(loc[0]) && Library.validateLng(loc[1])) {
        const paramLocation = `${loc[0]},${loc[1]}`;
        const paramDate = Library.validateDate(date) ? `,${date}T00:00:01Z` : '';

        return `${CONFIG.api.url.online}${CONFIG.api.key}/${paramLocation}${paramDate}?units=si`;
      }
    }

    return this.getApiUrlLocal(demoFile);
  }

  static getApiUrlLocal(demoFile) {
    return `${CONFIG.api.url.local}${demoFile}.json`;
  }

  /**
   * PARAM VALIDATION
   */

  static validateLat(value) {
    const reg = new RegExp(/^(\+|-)?(?:90(?:(?:\.0{1,7})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,7})?))$/);
    return this.validateValue(value, reg);
  }

  static validateLng(value) {
    const reg = new RegExp(/^(\+|-)?(?:180(?:(?:\.0{1,7})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,7})?))$/);
    return this.validateValue(value, reg);
  }

  static validateDate(value) {
    const reg = new RegExp(/(\d{4})-(\d{2})-(\d{2})/);
    return this.validateValue(value, reg);
  }

  static validateValue(value, regex) {
    if (value) {
      if (value !== '') {
        return regex.test(value);
      }
    }

    return false;
  }

  /**
   * DATE HANDLING
   */

  static getHour(timestamp) {
    return new Date(timestamp * 1000).getHours();
  }

}

export default Library;
