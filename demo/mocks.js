angular
  .module('app.mock', ['app', 'ngMockE2E'])
  .run([ '$httpBackend', function ($httpBackend) {
    var last_id = 0
      , contacts = []
      , reItem = /^\/\/api\/contact\/(.*)$/
      , reSearch = /^\/\/api\/contacts\?search\=(.*)$/
      , contentType = {
          'Content-Type': 'application/hal+json',
        };

    contacts.push({
      id: ++last_id,
      name: 'Jony',
      email: 'jonatan@maennchen.ch',
    });
    contacts.push({
      id: ++last_id,
      name: 'Elmer',
      email: 'elmer@luvdasun.com',
    });
    contacts.push({
      id: ++last_id,
      name: 'Denise',
      email: 'denise@luvdasun.com',
    });

    $httpBackend
      .whenGET('//api/')
      .respond(function () {
        return [
          200,
          {
            _links: {
              self: {
                href: '/'
              },
              contacts: {
                templated: true,
                href: '/contacts{?search}'
              },
              contact: {
                templated: true,
                href: '/contact{/id}'
              }
            }
          },
          contentType
        ];
      });

    $httpBackend
      .whenGET('//api/contacts')
      .respond(function () {
        return [
          200,
          {
            _links: {
              self: '/contacts'
            },
            _embedded: {
              item: contacts.slice(0).map(function (contact) {
                contact._links = {
                  self: '/contact/' + contact.id,
                };
                return contact;
              })
            },
            count: contacts.length
          },
          contentType
        ];
      });

    $httpBackend
      .whenPOST('//api/contacts')
      .respond(function (verb, url, contact) {
        contact = JSON.parse(contact);
        contact.id = ++last_id;
        contact._links = {
          self: '/contact/' + contact.id,
        };
        contacts.push(contact);
        return [
          201,
          contact,
          contentType
        ];
      });

    $httpBackend
      .whenDELETE(reItem)
      .respond(function (verb, url, body) {
        var params = reItem.exec(url)
          , id = parseInt(params[1], 0)
          , contactIndex = contacts.reduce(function (previous, contact, index) {
          if (previous < 0 &&
            contact.id === id) {
            return index;
          }
          return previous;
        }, -1);
        contacts.splice(contactIndex, 1);
        return [
          200,
          body,
          contentType
        ];
      });

    $httpBackend
      .whenGET(reSearch)
      .respond(function (verb, url) {
        var params = reSearch.exec(url)
          , term = params[1].toLowerCase()
          , foundContacts = contacts.filter(function (contact) {
              var name = contact.name.toLowerCase();
              return (~name.indexOf(term));
            });

        return [
          200,
          {
            _links: {
              self: '/contacts?search=' + encodeURIComponent(term),
            },
            _embedded: {
              item: foundContacts.slice(0).map(function (contact) {
                contact._links = {
                  self: '/contact/' + contact.id,
                };
                return contact;
              })
            },
            count: foundContacts.length
          },
          contentType
        ];
    });
  }]);
