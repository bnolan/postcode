const assert = require('assert');
const fs = require('fs');
const path = require('path');

/*

  Run a query and return it as json

  const db = new pg.Client(process.env.DATABASE_URL);

  app.get('/api/channel/:id', queryAndReturn(db, 'get-channel', 'channel', (req) => {
    return [req.params.id];
  }));

  The above command looks for ./queries/get-channel.sql, runs it, with the arguments
  passed in from the argumentMapper function, and returns the result as json.
 */

function queryAndReturn (client, name, fieldName, argumentMapper) {
  assert(name);

  var query = fs.readFileSync(path.join(__dirname, 'queries', `${name}.sql`)).toString();

  if (!fieldName) {
    fieldName = 'results';
  }

  const func = (req, res) => {
    // live reload
    if (!process.env.NODE_ENV) {
      query = fs.readFileSync(path.join(__dirname, 'queries', `${name}.sql`)).toString();
    }

    const args = argumentMapper ? argumentMapper(req) : [];

    client.query(query, args, (err, result) => {
      if (err) {
        throw err;
      }

      // pluralise field name to return all rows
      const plural = fieldName.slice(-1) === 's';

      // fixme - return empty array success true for plurality
      if (result.rows[0]) {
        const obj = { success: true };

        if (plural) {
          obj[fieldName] = result.rows;
        } else {
          obj[fieldName] = result.rows[0];
        }

        res.json(obj);
      } else {
        res.json({
          success: false
        });
      }
    });
  };

  // Returning functions is gross, but it works well in this case
  return func;
}

module.exports = { queryAndReturn };
