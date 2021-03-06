import { TemplateFn, CHANGE_TYPE } from '../../../../lib/webcomponents';
import { LockClosed } from "../../../icons/lockClosed/lockClosed";
import { LockOpen } from "../../../icons/lockOpen/lockOpen";
import { Login } from "./login";
import { html } from "lit-html";

export const LoginHTML = new TemplateFn<Login>((props) => {
	return html`
		<div id="pageContainer">
			<horizontal-centerer>
				<vertical-centerer fullscreen>
					<md-card padding-vertical="45" padding-horizontal="75" 
						id="formCard" level="2"
					>
						<form id="formContainer">
							<material-input id="emailInput" name="email"
								type="email" title="Account's email"
								error="Please enter a valid email address"
								autoComplete="username" fill required
								autoFocus label="Email"
							>
								<icon-button tabIndex="-1" slot="postIcon"
									aria-label="Remember email"
									title="Remember email"
									id="lockButton"
								>
									${props.emailRemembered ?
										LockClosed : LockOpen
								}</icon-button>
							</material-input>
							<material-input id="passwordInput" name="password"
								type="password" title="Account password"
								error="Please enter a password"
								autoComplete="password" fill required
								autoFocus label="Password"></material-input>
							<material-input id="twofactorInput" name="twofactor"
								type="tel" autoComplete="off" fill
								pattern="\\d{6}" error="Enter a 6-digit code"
								title="Twofactor authentication token (if enabled for the account)"
								autoFocus label="2FA Token (if enabled)"></material-input>
							<div id="buttonPositioner">
								<animated-button aria-label="Submit form" id="button" 
									content="SUBMIT"
								></animated-button>
							</div>
						</form>
					</form>
				</vertical-centerer>
			</horizontal-centerer>
			<theme-selector id="themeSelector"></theme-selector>
		</div>`;
}, CHANGE_TYPE.PROP);