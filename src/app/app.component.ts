import { CommonModule, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import * as _ from 'underscore';

const spreadsheetID = '1u1_8ND_BY1DaGaQdu0ZRZPebrOaTJekE9hyw_7BAlzw';
const url = `https://docs.google.com/spreadsheets/d/${spreadsheetID}/gviz/tq?tqx=out:json`;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NgFor, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  public dados: Array<any> = [];
  public dadosFiltrados: Array<any> = [];
  public totais: Array<any> = [];
  public loadingRanking!: boolean;
  public loadingLista!: boolean;
  public parametro: string = '';

  ngOnInit(): void {
    this.obtemDadosIniciais();
  }

  private obtemDadosIniciais() {
    this.loadingLista = true;
    this.loadingRanking = true;
    this.obtemDados().then(
      (data) => {
        const table = data.table;
        const rows = this.parser(table);
        this.dados = rows;
        this.dados = Object.entries(
          _.groupBy(rows, (item: any) => {
            return item.empresa;
          })
        );
        this.dados = this.transformaDados(this.dados);
        this.obtemTotais();
        this.loadingLista = false;
        this.loadingRanking = false;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  private obtemTotais(): any {
    const totais: Array<any> = [];
    _.each(this.dados, (item: any) => {
      totais.push({
        empresa: item.key,
        total: item.value.length
      });
    });
    totais.sort( (a, b) => {
      return a.total > b.total ? -1 : a.total < b.total ? 1 : 0;
    });

    for (let i = 0; i < 6; i++) {
      this.totais.push(totais[i]);
    }
  }

  private transformaDados(value: any): any {
    let keys = [];
    for (let key in value) {
      keys.push({ key: value[key][0], value: value[key][1] });
    }
    return keys;
  }

  private async obtemDados() {
    return await fetch(url)
      .then((res) => res.text())
      .then((text) => JSON.parse(text.substring(47).slice(0, -2)));
  }

  private parser(table: any) {
    const dados: Array<any> = table.rows
      .map((row: any) => [
        ...table.cols.map((col: any, index: any): any => {

          // COM CARIMBO
          //if (index === 0 || index === 1 || index === 2) {

          // SEM CARIMBO
          if (index === 0 || index === 1) {

            // COM CARIMBO
            // let carimbo;
            // if (index === 0){
            //   carimbo = row.c[index]?.v;
            //   carimbo = carimbo.split('Date(')[1].split(')')[0];
            //   carimbo = moment(carimbo,'YYYY,M,D,H,m,s').format('DD/MM/YYYY HH:mm:ss');
            // } else {
            //   carimbo = null;
            // }
            // return {
            //   [index === 0 ? 'carimbo' : index === 1 ? 'empresa' : 'motivo']:
            //     index === 0 ? carimbo : index === 1 ? (row.c[index]?.v).toUpperCase().trim() : (row.c[index]?.v).replace(/(<([^>]+)>)/gi, ""),
            // };

            // SEM CARIMBO
            return {
              [index === 0 ? 'empresa' : 'motivo']:
                index === 0 ? (row.c[index]?.v).toUpperCase().trim() : row.c[index]?.v,
            };
          }
        }),
      ])
      .map((data: any) =>
        data.reduce((acc: any, value: any) => ({ ...acc, ...value }), {})
      );

    dados.sort(function (a, b) {
      return a.empresa < b.empresa ? -1 : a.empresa > b.empresa ? 1 : 0;
    });

    return dados;
  }

  public pesquisar() {
    this.loadingLista = true;

    if (this.parametro === ''){
      this.dadosFiltrados = [];
      this.totais = [];
      this.obtemDadosIniciais();
    } else {
      this.dadosFiltrados = _.filter(this.dados, (dados) => {
        this.loadingLista = false;
        return dados.key.toLowerCase().indexOf(this.parametro.toLowerCase()) > -1;
      });
    }
  }

}
