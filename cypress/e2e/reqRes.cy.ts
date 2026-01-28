
interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
}

const customHeader = (apiKey: string) => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
});

const apiKey = Cypress.env('apiKey');
const timeLimit = 300; // 300 ms
let userData: any;

describe('Moxymind Backend Test', () => {

    it('GET - Should get list of users and asser response types and numbers', () => {
        cy.request({
            method: 'GET',
            url: `${Cypress.config().baseUrl}/users?page=2`,
            headers: customHeader(apiKey.req_get_api),
        }).then((response) => {
            expect(response.status).to.eq(200);
            const body = response.body;
            const users: User[] = body.data;
            // Assert we get "total" in response
            expect(body).to.have.property('total');
            expect(body.total).to.be.a('number');
            // Assert we get "last_name" for the first and second user
            expect(users[0].last_name).to.be.a('string').and.not.be.empty;
            expect(users[1].last_name).to.be.a('string').and.not.be.empty;
            // Get number of users returned
            const usersCount = body.data.length;
            // Users should be max of the total users
            expect(usersCount).to.be.at.most(body.total);
            // Log of users per page and total users
            cy.log(`Users per page ${usersCount}. Total users: ${body.total}`);

            // Validate data types from response
            expect(body.page).to.be.a('number');
            expect(body.per_page).to.be.a('number');
            expect(body.total).to.be.a('number');
            expect(body.total_pages).to.be.a('number');
            expect(body.data).to.be.an('array');

            // Validate data types for individual user
            body.data.forEach((user: User) => {
                expect(user.id).to.be.a('number');
                expect(user.email).to.be.a('string').and.include('@');
                expect(user.first_name).to.be.a('string');
                expect(user.last_name).to.be.a('string');
                expect(user.avatar).to.be.a('string').and.include('http'); // should be link
            });
        });
    });

    // Load external data
    before(() => {
        cy.fixture('users').then((data) => {
            userData = data;
        });
    });

    it('POST - Should create users from external data and assert responses and duration', () => {
        cy.fixture('users').then((userData) => {
            userData.forEach((user: { name: string; job: string }) => {
                cy.request({
                    method: 'POST',
                    url: `${Cypress.config().baseUrl}/users`,
                    headers: customHeader(Cypress.env('apiKey').req_post_api),
                    body: user
                }).then((response) => {
                    expect(response.status).to.eq(201);

                    // Assert id is a number
                    expect(response.body).to.have.property('id');
                    expect(response.body.id).to.be.a('string').and.match(/^\d+$/);
                    // Assert createdAt has today's date
                    expect(response.body).to.have.property('createdAt');
                    expect(response.body.createdAt).to.be.a('string');
                    const todayDate = new Date().toISOString().split('T')[0];
                    const responseDate = response.body.createdAt.split('T')[0];
                    expect(responseDate).to.eq(todayDate);
                    // Assert response time max 300ms
                    expect(response.duration).to.be.lessThan(timeLimit);
                    // Assert response body has all expected keys
                    expect(response.body).to.include.keys('name', 'job', 'id', 'createdAt');

                    cy.log(`${user.name} created in ${response.duration}ms`);
                });
            });
        });
    });
});