// SQL Connection Configuration
import mysql from 'mysql2/promise';
export const pool = mysql.createPool({
  host:'localhost', user:'root', password:'Queenzixi0618.', database:'eco_env',
  waitForConnections:true, connectionLimit:10
});