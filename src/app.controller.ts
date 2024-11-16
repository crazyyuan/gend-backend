import { Controller, Param, Post, Body, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DefaultGenerics, StreamChat } from 'stream-chat';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupBody {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: 'string' })
  wallet: string;
}

@Controller()
export class AppController {
  private serverClient: StreamChat<DefaultGenerics>;
  constructor(private readonly appService: AppService) {
    this.serverClient = StreamChat.getInstance(
      process.env.STREAMCHAT_KEY,
      process.env.STREAMCHAT_SECRET,
    );
  }

  @Get('/hello')
  hello() {
    return { key: 'hello' };
  }

  @Post('/signup')
  async signup(@Body() body: SignupBody) {
    const token = this.serverClient.createToken(body.wallet);

    const response = await this.serverClient.upsertUsers([
      {
        id: body.wallet,
        role: 'user',
      },
    ]);

    return {
      userId: body.wallet,
      token: token,
    };
  }

  @Post('/match/:id')
  async match(@Param('id') id: string) {
    const channel = this.serverClient.channel('match', '', {
      created_by_id: '4645',
    });
    await channel.create();
    // create the channel and set created_by to user id 4645
    const update = await channel.update({
      name: 'myspecialchannel',
      image: 'imageurl',
      mycustomfield: '123',
    });
  }

  @Post('/chat')
  async chat(@Param('id') id: string) {
    console.log(id);
  }
}
