
exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex('calls').del()
    .then(function () {
      // Inserts seed entries
      return knex('calls').insert([
        {id: 1, status: 'open', guest: 'john', agent: "admin"}
      ]);
    });
};
