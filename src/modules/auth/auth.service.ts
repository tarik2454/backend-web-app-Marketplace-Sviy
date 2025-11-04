// @Injectable()
// export class AuthService {
//   constructor(private readonly usersService: UsersService) {}

//   async validateUser(email: string, pass: string) {
//     const user = await this.usersService.findByEmail(email);

//     if (user && (await bcrypt.compare(pass, user.password))) {
//       return user;
//     }
//     return null;
//   }
// }
