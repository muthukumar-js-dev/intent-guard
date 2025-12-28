import React from 'react';
import { useState } from 'react';

export function validateEmail(email) {
  return email.includes('@');
}

export default class DataService {
  constructor() {
    this.data = [];
  }

  async fetchData() {
    return this.data;
  }
}

export const CONFIG = {
  apiUrl: 'https://api.example.com'
};
