import _ from 'lodash'
import { Account } from '../accounts/account.interface'
import { AccountService } from '../accounts/account.service'
import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res } from '@nestjs/common'
import { CommentDto, CommentWithId } from './comment.interface'
import { CommentService, SortOrder } from './comment.service'
import { ConfigService } from '../config/config.service'
import { ContentFilteringService } from './content-filtering-service'
import { EmailService } from '../emails/email.service'
import moment from 'moment'
import { Request, Response } from 'express'
import { SendMailService } from '../emails/sendmail.service'
//import { Logger } from 'nestjs-pino'

@Controller('comments')
export class CommentsController {

  constructor(
    private readonly accountService: AccountService,
    private readonly commentsService: CommentService,
    private readonly contentFilteringService: ContentFilteringService,
    private readonly configService: ConfigService,
    private readonly sendMailService: SendMailService,
    private readonly emailService: EmailService) {}

  @Get()
  async comments(@Req() req: Request): Promise<CommentWithId[]> {
    const allComments = await this.commentsService.commentsForAccount(_.get(req, 'account') as Account, SortOrder.Asc)
    return this.formattedForContentType(allComments, this.formatFromRequest(req))
  }

  @Get(':url')
  async commentsForUrl(@Req() req: Request, @Param() params : { url: string }): Promise<CommentWithId[]> {
    const since  = req.query['since'] as string
    const fromDate = req.query['fromDate'] as string
    const maybeDate = moment(fromDate)
    return this.formattedForContentType(
      (await this.commentsService
        .commentsForUrl(
          _.get(req, 'account') as Account,
          params.url, {
          afterId: since,
          fromDate: fromDate && maybeDate.isValid() ? maybeDate.toDate() : undefined
          })
      ), this.formatFromRequest(req))
  }

  private formatFromRequest(req: Request): string {
    return (req.query['format'] ?? '').toString().toLowerCase()
  }

  private formattedForContentType(comments: CommentWithId[], format?: string): CommentWithId[] {
    switch(format) {
      case 'markdown':
        return comments.map(c => {
          c.text = this.contentFilteringService.toMarkdown(c.text)
          return c
        })
      case 'html':
        return comments.map(c => {          
          c.text = this.contentFilteringService.toHtml(c.text)
          return c
        })
      case 'text':  
        return comments.map(c => {          
          c.text = this.contentFilteringService.toPlainText(c.text)
          return c
        })
      default:
        return comments
    }
  }

  @Post()
  async postCommentForUrl(@Req() req: Request, @Body() comment: CommentDto,
    @Res() res: Response): Promise<void> {
    const account = _.get(req, 'account') as Account
    await this.commentsService.create(account, {
      ... comment,
      postedAt: new Date()
    }, req.ip)

    const emailSettings = await this.accountService.emailSettingsFor(account)
    if (emailSettings?.notifyOnComments) {
      // notify
      // TODO move to a job queue
      const email = this.emailService.notifyOnSingleComment(comment, `${this.configService.adminUrl()}/dashboard`)
      this.sendMailService.send(this.configService.mailgunSender(), account.email, email.subject, email.html, email.text)  
    }

    if (req.headers['content-type'] !== 'application/json') {
      // assuming the request comes from the web page -> redirect back
      return res.redirect(comment.postUrl)
    }

    res.status(HttpStatus.CREATED).send()

  }
}
