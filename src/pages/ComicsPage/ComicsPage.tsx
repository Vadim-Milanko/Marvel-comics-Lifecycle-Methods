import React, { Component } from 'react';

import Spinner from '../../components/Spinner/Spinner';
import { IProps, IState } from './iterfaces';
import { API_KEY, STANDART_LARGE } from './constants';
import Comics from './components/Comics/Comics';
import api from '../../api/Api';
import { getQueryParams } from '../../utils';

import './style.scss';

class ComicsPage extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props)

        this.state = {
            comicses: [],
            isLoading: false,
        }
    }

    async fetchComics(): Promise<void> {
        const { match } = this.props;
        const { characterId } = match.params;
        const { location } = this.props;


        const queryParams = getQueryParams(location.search);

        this.setState({ isLoading: true });

        try {
            const response = await api.fetchComics(characterId, { params: { ...queryParams, apikey: API_KEY } });

            this.setState({
                comicses: response.results,
                isLoading: false,
            })
        } catch (error) {
            this.setState({ isLoading: false });
        }
    }

    componentDidMount(): void {
        this.fetchComics();
    }

    render(): JSX.Element {
        const { comicses, isLoading } = this.state;

        return (
            <div className='comics-page-wrapper'>
                <h2 className='page-title'>Hero comics</h2>
                <div>
                    {
                        comicses.map(comics => {

                            const { thumbnail } = comics;
                            const { extension, path } = thumbnail;
                            const imgSize = STANDART_LARGE;
                            const imgUrl = `${path}/${imgSize}.${extension}`;

                            return (
                                <Comics
                                    key={comics.id}
                                    title={comics.title}
                                    description={comics.description}
                                    imgUrl={imgUrl} />
                            )
                        })
                    }
                </div>
                <Spinner isLoading={isLoading} />
            </div>
        )
    }
}

export default ComicsPage