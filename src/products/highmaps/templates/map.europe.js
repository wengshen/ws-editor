/*

Highcharts Editor 

Copyright (c) 2016-2017, Highsoft

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

ws.templates.add('Map', {
  title: 'Basic European Map',
  description: [
    'Basic European map.',
    'Good starting point for European geographical data.'
  ],
  thumbnail: '',
  dataValidator: false,
  sampleSets: ['eu-gdp'],
  constructor: 'Map',
  config: {
    chart: {
      borderWidth: 1
    },

    mapNavigation: {
      enabled: true
    },

    legend: {
      layout: 'horizontal',
      verticalAlign: 'bottom'
    },

    colorAxis: {
      min: 0
    },

    series: [
      {
        mapData: 'custom/europe',
        joinBy: 'name',
        dataLabels: {
          enabled: false,
          format: '{point.name}'
        }
      }
    ]
  }
});
