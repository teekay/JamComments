import _ from 'lodash'
import { Account } from '../accounts/account.interface'
import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res } from '@nestjs/common'
import { CommentBase, CommentDto } from './comment.interface'
import { CommentService } from './comment.service'
import moment from 'moment'
import { Request, Response } from 'express'
//import { Logger } from 'nestjs-pino'

@Controller('comments')
export class CommentsController {

  constructor(private readonly commentsService: CommentService) {}

  @Get(':url')
  async commentsForUrl(@Req() req: Request, @Param() params : { url: string }): Promise<CommentBase[]> {
    const since  = req.query['since'] as string
    const fromDate = req.query['fromDate'] as string
    const maybeDate = moment(fromDate)
    return await this.commentsService.commentsForUrl(_.get(req, 'account') as Account, params.url, {
      afterId: since, fromDate: fromDate && maybeDate?.isValid() ? maybeDate.toDate() : undefined
    })
  }

  @Post()
  async postCommentForUrl(@Req() req: Request, @Body() comment: CommentDto,
    @Res() res: Response): Promise<void> {
    const account = _.get(req, 'account') as Account
    await this.commentsService.create(account, {
      ... comment,
      postedAt: new Date()
    }, req.ip)
    res.status(HttpStatus.CREATED).send() 
  }
}
